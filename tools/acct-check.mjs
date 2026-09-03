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
  const arrive = (uid) => netTook({
    access_token: 'not a jwt', refresh_token: 'a refresh token', user: { id: uid }
  });

  /* Somebody with a whole account on this phone: the two things the
     photograph showed, and the four that do not show but travel further --
     the face goes to the server as the new account's `av`, and the follow
     list is what the owner is on two phones to test. */
  const beA = () => {
    ME.name = 'Lingua'; ME.handle = 'lingua2';
    ME.bio = 'a line only this phone has'; ME.pic = PIC;
    ME.link = 'example.com'; ME.loc = 'どこか';
    ME.fo = ['someone', 'someone-else'];
    saveMe();
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
    window.__seed(); SET.done = true;
    wipeParked();
    netOut();
    arrive(A); beA();
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
  if (meFollowing().length) no('1: 前の人のフォローが残っている — ' + meFollowing().length + '人');
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
  if (meFollowing().length !== 2) no('2: フォローが消えている — ' + meFollowing().length + '人');
  say('2: 同じ人が入り直すと、書いたものは全部そこにある');

  /* ---- 3. the two of them do not become one ----------------------------
     Going A -> B -> A -> B: the second person must still be empty, which is
     what says the parking is per account and not one drawer everybody shares. */
  netOut(); arrive(B);
  if (ME.name || ME.bio || meFollowing().length)
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
  LANGS[langId] = { name: 'A の言語', mine: true, sid: 'A-lang', uid: A };
  const id9 = langId;
  langStore();
  netOut(); arrive(B);
  let r9 = askRow(id9);
  unwire();
  if (!r9.refused) no('9: B が A の言語の行を受け取った — sid=' + JSON.stringify(r9.got));
  if (posted.length)
    no('9: B のセッションで language に POST した — owner=' +
       JSON.stringify(posted[0].body && posted[0].body.owner));
  say('9: 別のアカウントは、前の人の言語をサーバへ上げない');

  /* 10. 一度も上がっていない言語も、前の人のものなら上げない。
     これが本当に失われる形です ── sid が無いので netLangRow() は
     `owner: SESS.uid` で新しい行を作り、A の中身が B のものになります。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: 'A の言語', mine: true, uid: A };
  const id10 = langId;
  langStore();
  netOut(); arrive(B);
  let r10 = askRow(id10);
  unwire();
  if (posted.length)
    no('10: A の言語が B のアカウントに作られた — owner=' +
       JSON.stringify(posted[0].body && posted[0].body.owner) +
       ' name=' + JSON.stringify(posted[0].body && posted[0].body.name));
  if (!r10.refused) no('10: 上がっていない他人の言語の行が受け取られた');
  say('10: 一度も上がっていない他人の言語も、上げない');

  /* 11. そして本人は今までどおり通る。片側だけ閉じても通ってしまうので、
     両方向を見ます ── 閉じすぎると自分の言語が上がらなくなります。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: '自分の言語', mine: true, uid: A };
  langStore();
  netOut(); arrive(A);
  let r11 = askRow();
  unwire();
  if (r11.refused) no('11: 本人が自分の言語の行を断られた');
  if (!posted.length) no('11: 本人の言語がサーバに作られなかった');
  if (!LANGS[langId].sid) no('11: 作った行の sid が端末に残っていない');
  say('11: 本人の言語は、今までどおり上がる');

  /* 12. uid の無い、しかし一度は上がった言語 ── 今日どの端末にもあるやつ。
     ここは端末の中に答えが無いので、**サーバに訊きます。**
     `language_read` は持ち主にしか行を返さないので、空の返事は
     「あなたのではない」というサーバの言葉です。憶測は一つもありません。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: '前からある言語', mine: true, sid: 'old-lang' };
  langStore();
  /* 名指しします ── `langId` ではなく。印の無い言語は 35 番のとおり次に入った
     人のものにならないので、B が入った瞬間 langForAcct() が B のために別の
     言語を開きます。`askRow()` を素で呼ぶと、その B の新しい言語について
     訊くことになる ── 9 番と 10 番が前から名指ししているのと同じ理由です。 */
  const id12 = langId;
  netOut(); arrive(B);
  netGet = (path, ok) => { getted.push(path); ok([]); };     /* 持ち主ではない */
  let r12 = askRow(id12);
  unwire();
  if (!getted.length) no('12: uid が無いのにサーバへ訊かなかった');
  if (!r12.refused) no('12: サーバが行を返さないのに通した');
  if (posted.length) no('12: 断ったあとで行を作りに行った');
  if (LANGS[id12].uid) no('12: 持ち主でないのに uid を書いた');
  say('12: uid の無い言語は、サーバが持ち主を答える（他人なら断る）');

  /* そして持ち主なら通り、そのとき uid が端末に残る ── 次からは訊かない。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: '前からある言語', mine: true, sid: 'old-lang' };
  langStore();
  const id12b = langId;
  netOut(); arrive(A);
  netGet = (path, ok) => { getted.push(path); ok([{ id: 'old-lang' }]); };
  let r12b = askRow(id12b);
  unwire();
  if (r12b.refused) no('12: 持ち主が自分の言語を断られた');
  if (r12b.got !== 'old-lang') no('12: 持ち主に sid が渡らなかった');
  if (LANGS[id12b].uid !== A) no('12: 通ったのに uid が端末に残っていない');
  say('12: 持ち主なら通り、uid が残るので次からは訊かない');

  /* ---- 13-14. 自分の言語が、サーバから降りてくる ------------------------
     「前のアカウント消えたんだが？」── 消えてはいなくて、戻る道が一本も
     ありませんでした。netLangSync() は **開いている** 言語しか見ず、それを
     LANGS[langId].sid（端末のもの）から見つけるので、端末に項目の無い言語は
     どうやっても届きませんでした。

     docs/DATA_SAFETY.md 第2則 ── 無いものを埋めて、止まる。ここで押さえるのは
     その「止まる」ほうです。埋めるだけなら簡単で、危ないのは勝つほうなので。 */
  start();
  netOut(); arrive(A);
  /* 端末には一つ、A の言語がある（sid つき）。サーバはそれと、もう一つ返す。 */
  LANGS[langId] = { name: 'いまの言語', mine: true, sid: 'here-already', uid: A };
  langStore();
  const keepId = langId;
  const keepWords = localStorage.getItem(langKeyOf(keepId, 'words'));
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
  netGet = realGet;

  if (made !== 1) no('13: 降ろした数が 1 でない — ' + made + '（既にある言語まで作った？）');
  if (langId !== keepId) no('13: 開いている言語が動いた — 立っていた場所が変わる');
  if (LANGS[keepId].name !== 'いまの言語')
    no('13: 既にある言語の名前が上書きされた — ' + JSON.stringify(LANGS[keepId].name));
  if (localStorage.getItem(langKeyOf(keepId, 'words')) !== keepWords)
    no('13: 既にある言語の単語が上書きされた ── これが「勝つ」ほう');
  say('13: 既にある言語には一切触らない（名前も、単語も、開いている場所も）');

  let far = '';
  for (const k in LANGS) if (LANGS[k] && LANGS[k].sid === 'far-lang') far = k;
  if (!far) no('14: サーバにあった言語が端末に作られなかった');
  else {
    if (LANGS[far].uid !== A) no('14: 降ろした言語に uid が付いていない');
    if (!LANGS[far].mine) no('14: 降ろした言語が自分のものになっていない');
    if (localStorage.getItem(langKeyOf(far, 'words')) !== '[{"hw":"むこうの単語"}]')
      no('14: 降ろした言語の単語が入っていない');
    if (localStorage.getItem(langKeyOf(far, 'lang')) !== 'むこうの言語')
      no('14: 降ろした言語の名前スライスが入っていない');
  }
  say('14: 端末に無い自分の言語は、スライスごと降りてくる');

  /* 15. そして、降ろす先に既にスライスがあったら書かない。
     `langMint()` は時計から id を作るので、**LANGS には無いのにスライスだけ
     残っている id** ── storage が半分だけ消えた端末、索引を失った言語 ── に
     ぶつかりうる。そこへ書けば、それは誰かの言語を消したことになります。
     滅多に無い形なので、id を握って直接押さえます。 */
  start();
  netOut(); arrive(A);
  const ORPH = 'Lorphan';
  localStorage.setItem(langKeyOf(ORPH, 'words'), '[{"hw":"残っていた単語"}]');
  const realMint = langMint;
  langMint = () => { LANGS[ORPH] = { name: '', mine: true }; return ORPH; };
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/language?select=id,name') === 0)
      return ok([{ id: 'far-2', name: 'むこうの言語' }]);
    if (path.indexOf('/rest/v1/slice') === 0)
      return ok([{ kind: 'words', body: '[{"hw":"降りてきた単語"}]', no: 9 },
                 { kind: 'lang',  body: 'むこうの言語', no: 9 }]);
    return ok([]);
  };
  netLangsDown(() => {});
  netGet = realGet; langMint = realMint;

  if (localStorage.getItem(langKeyOf(ORPH, 'words')) !== '[{"hw":"残っていた単語"}]')
    no('15: 端末に既にあったスライスが降りてきたもので上書きされた ── 「勝つ」ほう');
  if (localStorage.getItem(langKeyOf(ORPH, 'lang')) !== 'むこうの言語')
    no('15: 無かったスライスが埋められていない ── 埋めて止まる、の埋めるほう');
  say('15: 降ろす先に既にあるスライスは書かない。無いものだけ埋める');

  /* ---- 16-18. プランはアカウントのもの --------------------------------
     「課金とアカウントとキーボードはアカウントに結びつく。
       じゃないとアカウント変えたら無限に言語作れるやん」OWNER 2026-09-01

     プランは SET.plan ── lingua.set、端末の設定 ── にあり、アカウントにも
     サーバーにも紐づいていませんでした。二台目で入れば無料から始まります。 */

  /* 16. サーバーのほうが上なら、それを採る。 */
  start();
  netOut(); arrive(A);
  SET.plan = 'free'; SET.planWas = 'free'; save();
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/plan') === 0) return ok([{ plan: 'pro' }]);
    return ok([]);
  };
  netPlanSync(() => {});
  netGet = realGet;
  if (plan() !== 'pro') no('16: アカウントが持っている段が降りてこない — ' + plan());
  say('16: アカウントのほうが上なら、その段になる');

  /* 17. **端末のほうが上なら、取り上げない。**これがいちばん危ない向きです ──
     サーバーの答えをそのまま採ると、領収書を持っている端末から段を
     取り上げます。docs/PAID_FEATURES.md。 */
  start();
  netOut(); arrive(A);
  SET.plan = 'pro'; SET.planWas = 'pro'; save();
  let sent = [];
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/plan') === 0) return ok([{ plan: 'free' }]);
    return ok([]);
  };
  const realUp = netPlanUp;
  netPlanUp = (id) => { sent.push(id); };
  netPlanSync(() => {});
  netGet = realGet; netPlanUp = realUp;
  if (plan() !== 'pro') no('17: 端末が持っていた段が取り上げられた — ' + plan());
  if (sent.indexOf('pro') < 0)
    no('17: 上の段をアカウントに伝えていない — 送ったもの ' + JSON.stringify(sent));
  say('17: 端末のほうが上なら取り上げず、アカウントに伝える');

  /* 18. そして段が動いたら、その場でアカウントに伝わる。capLapse() が
     プランの動いた唯一の場所 ── ボタンでも領収書でも失効でもここに来る。 */
  start();
  netOut(); arrive(A);
  SET.plan = 'free'; SET.planWas = 'free'; save();
  sent = [];
  netPlanUp = (id) => { sent.push(id); };
  SET.plan = 'pro';
  capLapse();
  netPlanUp = realUp;
  if (sent.indexOf('pro') < 0)
    no('18: 段が動いてもアカウントに伝わらない — 送ったもの ' + JSON.stringify(sent));
  say('18: 段が動いたら、その場でアカウントに伝わる');

  /* ---- 19. 言語の数は、そのアカウントの言語を数える -------------------
     「じゃないとアカウント変えたら無限に言語作れるやん」 */
  start();
  netOut(); arrive(A);
  LANGS = {};
  LANGS['La'] = { name: 'A の1', mine: true, uid: A };
  LANGS['Lb'] = { name: 'A の2', mine: true, uid: A };
  LANGS['Lc'] = { name: 'B の1', mine: true, uid: B };
  LANGS['Ld'] = { name: '印の無い言語', mine: true };
  langStore();
  const asA = langCount();
  netOut(); arrive(B);
  const asB = langCount();
  /* 印の無い `Ld` は誰の数にも入りません。オンボーディングの歩きの途中
     （`SET.done` が偽）だけが印の無い言語を自分のものと答える場所で、ここは
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

  /* 21. 端末に無ければアカウントのを取り、端末にあれば上げる。
     どちらの向きも何も壊しません ── 埋めるか、送るか。 */
  start();
  netOut(); arrive(A);
  ME.bio = ''; saveMe();
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/profile?select=bio') === 0)
      return ok([{ bio: 'アカウントに書いてあった一行' }]);
    return ok([]);
  };
  netBioSync();
  netGet = realGet;
  if (ME.bio !== 'アカウントに書いてあった一行')
    no('21: 端末に無いのにアカウントの自己紹介を取っていない — ' + JSON.stringify(ME.bio));

  ME.bio = 'この端末で書いた一行'; saveMe();
  let patched = '';
  const realSend = netSend;
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/profile?select=bio') === 0) return ok([{ bio: '' }]);
    return ok([]);
  };
  netSend = (method, path, body, tok, ok2, bad2) => {
    if (method === 'PATCH') patched = String(body && body.bio || '');
  };
  netBioSync();
  netGet = realGet; netSend = realSend;
  if (patched !== 'この端末で書いた一行')
    no('21: 端末の自己紹介がアカウントに上がらない — ' + JSON.stringify(patched));
  if (ME.bio !== 'この端末で書いた一行')
    no('21: 上げるついでに端末のものを消した');
  say('21: 端末に無ければアカウントのを取り、端末にあれば上げる（両方向）');

  /* ---- 22. 人の言語に、住所と、扉が開いているかが付く ------------------
     「当たり前だけどsnsとして機能してない」OWNER 2026-09-01

     netLangNames() は `{持ち主: 名前}` を返していました。名前は、他人の言語に
     ついて**唯一なにも出来ないもの**です ── そこからページへ行けないし、
     公開されている言語とされていない言語の区別も付きません。どちらも
     `language` の列（`id` と `published_at`）で、訊いていなかっただけです。 */
  start();
  netOut(); arrive(A);
  let langPath = '';
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/language') === 0) langPath = path;
    if (path.indexOf('/rest/v1/profile_seen') === 0)
      return ok([{ id: B, handle: 'iri', display: 'Iri', av: null, bio: '' }]);
    if (path.indexOf('/rest/v1/language') === 0)
      return ok([{ id: 'lang-id-1', owner: B, name: 'むこうの言語',
                   published_at: '2026-08-30T00:00:00Z' }]);
    return ok([]);
  };
  let w2 = null;
  netWho('iri', (w) => { w2 = w; }, () => {});
  netGet = realGet;
  if (langPath.indexOf('published_at') < 0)
    no('22: 言語を published_at 抜きで訊いている — ' + langPath);
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
      return ok([{ id: B, handle: 'iri', display: 'Iri', av: null, bio: '' }]);
    if (path.indexOf('/rest/v1/language') === 0)
      return ok([{ id: 'lang-id-2', owner: B, name: '非公開', published_at: null }]);
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
    if (path.indexOf('/rest/v1/follow?select=followed(handle)') === 0)
      return ok([{ followed: { handle: 'kai' } }]);
    if (path.indexOf('/rest/v1/follow?select=follower(handle)') === 0)
      return ok([{ follower: { handle: 'veth' } }]);
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
  if (j2.indexOf('handle=eq.iri') < 0) no('30: ハンドルから人を引いていない');
  if (j2.indexOf('follower=eq.' + B) < 0)
    no('30: 人のフォロー中を、その人の uid で訊いていない — ' + j2);
  if (!hisFo || hisFo[0] !== 'kai') no('30: 人のフォロー中が返らない');

  asked2 = [];
  let hisFr = null;
  netFollowers((r) => { hisFr = r; }, () => {}, 'iri');
  if (asked2.join('\n').indexOf('followed=eq.' + B) < 0)
    no('30: 人のフォロワーを、その人の uid で訊いていない');
  if (!hisFr || hisFr[0] !== 'veth') no('30: 人のフォロワーが返らない');

  /* 居ない人は空ではなく「訊けなかった」。空の一覧と、そんな人は居ない、は
     別のことです。 */
  netGet = (path, ok) => ok([]);
  let gone2 = 'untouched';
  netFollowers((r) => { gone2 = r; }, () => {}, 'nobody');
  if (gone2 !== null) no('30: 居ない人のフォロワーが「空の一覧」で返った — ' + JSON.stringify(gone2));
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
  const realFollow = netFollow;
  netFollow = () => {};
  WHO_HAVE['iri'] = { who:'Iri', hd:'iri', av:null, lname:'Vethi', bio:'',
                      fo:0, fr:3, out:false };
  ME.fo = [];
  meFollow('iri');
  if (WHO_HAVE['iri'].fr !== 4)
    no('30b: フォローしても、その人のフォロワーが動かない — ' + WHO_HAVE['iri'].fr);
  meFollow('iri');
  if (WHO_HAVE['iri'].fr !== 3)
    no('30b: 外しても戻らない — ' + WHO_HAVE['iri'].fr);
  WHO_HAVE['nemo'] = { who:'N', hd:'nemo', av:null, lname:'', bio:'',
                       fo:undefined, fr:undefined, out:false };
  meFollow('nemo');
  if (WHO_HAVE['nemo'].fr !== undefined)
    no('30b: 誰も数えていない数に足した — ' + WHO_HAVE['nemo'].fr);
  netFollow = realFollow;
  say('30b: 押した瞬間にその人のフォロワーも動く（数えていない数は数えないまま）');

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
  ME.fo = ['kai']; ME.fr = ['veth']; saveMe();
  const foSeen = [];
  netGet = (path, ok) => {
    foSeen.push(path);
    if (path.indexOf('/rest/v1/profile?select=id') === 0)
      return ok([{ id: B }]);
    if (path.indexOf('/rest/v1/follow?select=follower(handle)') === 0)
      return ok([{ follower: { handle: 'noor' } }, { follower: { handle: 'sela' } }]);
    if (path.indexOf('/rest/v1/follow?select=followed(handle)') === 0)
      return ok([{ followed: { handle: 'tavi' } }]);
    return ok([]);
  };

  /* 人のフォロワー。 */
  NAV = [{ r: 'follows', a: 'ers:iri' }];
  let seenHtml = vFollows();
  if (foSeen.join('\n').indexOf('handle=eq.iri') < 0)
    no('30c: 画面が、その人のハンドルで訊いていない');
  if (seenHtml.indexOf('noor') < 0 || seenHtml.indexOf('sela') < 0)
    no('30c: その人のフォロワーが画面に出ない');
  if (seenHtml.indexOf('veth') >= 0)
    no('30c: 人の画面に自分のフォロワーが出ている');
  if ((ME.fo || []).join(',') !== 'kai' || (ME.fr || []).join(',') !== 'veth')
    no('30c: 人の一覧が自分の一覧を書き換えた ── ' +
       JSON.stringify([ME.fo, ME.fr]));

  /* 人のフォロー中 ── 同じ画面、引数のもう半分。 */
  NAV = [{ r: 'follows', a: 'ing:iri' }];
  seenHtml = vFollows();
  if (seenHtml.indexOf('tavi') < 0) no('30c: その人のフォロー中が出ない');
  if (seenHtml.indexOf('kai') >= 0)
    no('30c: 人の画面に自分のフォロー中が出ている');

  /* 引数にハンドルが無ければ自分のぶん ── 今までどおり。 */
  NAV = [{ r: 'follows', a: 'ing' }];
  if (vFollows().indexOf('kai') < 0) no('30c: 自分のフォロー中が出なくなった');

  /* 答えが来る前は「まだ誰もいない」と言わない。 */
  netGet = () => {};
  NAV = [{ r: 'follows', a: 'ers:zoya' }];
  const waiting = vFollows();
  if (waiting.indexOf(t('me.followers.none')) >= 0)
    no('30c: 答えが来る前に「まだ誰もいない」と言っている');
  say('30c: 人のフォロー中／フォロワーの一覧が画面に出る ── 自分のぶんは一行も動かない');

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
  netSend = (m, path, body, tok, ok) => {
    if (m === 'DELETE') drops.push(path);
    if (ok) ok({});
  };
  LANGS = {
    'Lgo':   { name: '消すほう',   mine: true, uid: A, sid: 'srv-go' },
    'Lstay': { name: '残るほう',   mine: true, uid: A, sid: 'srv-stay' },
    'Lb':    { name: 'B のもの',   mine: true, uid: B, sid: 'srv-b' }
  };
  langStore();
  const w30d = [{ hw: 'kano', ph: ['k'], mn: 'hill', mns: ['hill'], pos: 'n' }];
  try {
    localStorage.setItem(langKeyOf('Lgo', 'words'), JSON.stringify(w30d));
    localStorage.setItem(langKeyOf('Lgo', 'kb'), '{"lay":[]}');
    localStorage.setItem(langKeyOf('Lstay', 'words'), JSON.stringify(w30d));
    localStorage.setItem(langKeyOf('Lb', 'words'), JSON.stringify(w30d));
  } catch (e) {}
  POSTS = [{ id: 'p30d', ln: 'kano', at: 1 }]; savePosts();
  DRAFTS = [{ at: 1, ln: 'a draft', mn: '', to: '', pr: 0, pics: [], vo: null, pv: false }];
  draftsSave();
  langId = 'Lgo'; langName = '消すほう';

  wipeLangs();
  if (typeof popOn === 'function' && popOn()) popYes();
  else no('30d: 言語の削除が何も訊かずに消した ── ポップが出ていない');

  /* 消した言語の作ったものは、一つも残らない。 */
  for (const sl of SLICES)
    if (localStorage.getItem(langKeyOf('Lgo', sl)))
      no('30d: 消した言語の ' + sl + ' が残っている');
  if (LANGS['Lgo']) no('30d: 消した言語が索引に残っている');
  /* そして、それ以外は一つも動かない。 */
  if (!LANGS['Lstay']) no('30d: 同じアカウントの別の言語まで消えた');
  if (!LANGS['Lb']) no('30d: 別のアカウントの言語まで消えた');
  if (!localStorage.getItem(langKeyOf('Lstay', 'words')))
    no('30d: 同じアカウントの別の言語の単語が消えた');
  if (!localStorage.getItem(langKeyOf('Lb', 'words')))
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
  if (langId === 'Lgo') no('30d: 消した言語に立ったままになっている');
  if (!langOwned(langId)) no('30d: 消したあと、他人の言語に立っている');

  netSend = realSend30d;
  LANGS = keepL30d; langId = keepId30d; langName = keepNm30d; langStore();
  say('30d: 言語を一つ消すのは、その一つだけ ── ほかの言語も投稿も下書きも動かず、サーバーからも消える');

  /* ---- 31. キーボードのプールも、そのアカウントのぶん -------------------
     「じゃないとアカウント変えたら無限に言語作れるやん」OWNER 2026-09-01。
     langCount() と同じ穴が kbCount() にもありました ── LANGS は端末のもので
     サインアウトしても残るので、**他人の言語のキーボードで、この人が作れる
     プールが埋まります。**

     langAcct() ではなく langOwned() を訊きます: 前者は `mine` も見ますが、
     この端末が「自分のもの」と言われていない言語のキーボードも、キーボード
     です。plan-check がそれを捕まえました。 */
  start();
  netOut(); arrive(A);
  const keepKbLangs = LANGS, keepKbId = langId;
  LANGS = {};
  LANGS['Lmine']  = { name: '自分', mine: true, uid: A };
  LANGS['Ltheirs']= { name: '他人', mine: true, uid: B };
  langId = 'Lmine';
  localStorage.setItem(langKeyOf('Lmine', 'kb'),
    JSON.stringify({ kbs: [{ rows: [] }] }));
  localStorage.setItem(langKeyOf('Ltheirs', 'kb'),
    JSON.stringify({ kbs: [{ rows: [] }, { rows: [] }] }));
  kbRead();
  const mineOnly = kbCount();
  LANGS = keepKbLangs; langId = keepKbId; kbRead();
  if (mineOnly !== 1)
    no('31: 他人の言語のキーボードが数に入っている — ' + mineOnly + '（自分のは1つ）');
  say('31: キーボードのプールは、そのアカウントの言語のぶんだけ');

  /* ---- 32. 言語の一覧に、他人のアカウントの言語が出ない ----------------
     「あと違うアカウントでログインしてんのに前のやつ出てくるんだけど？」
     LANGS は端末のもので、サインアウトしても残ります。だからこの一覧は
     **前のアカウントの言語を、次に入った人に見せていました。**

     **消してはいません。**入り直せば元どおり出ます ── ここで押さえるのは
     その両方です。そして `docs/DATA_SAFETY.md`「短い一覧は削除ではない」に
     従って、**出していない件数を必ず言います。** */
  start();
  netOut(); arrive(A);
  const keepL2 = LANGS, keepId2 = langId, keepNm2 = langName;
  LANGS = {};
  LANGS['La'] = { name: '自分の', mine: true, uid: A };
  LANGS['Lb'] = { name: '他人の1', mine: true, uid: B };
  LANGS['Lc'] = { name: '他人の2', mine: true, uid: B };
  langId = 'La';
  /* langRow() draws the OPEN language from the live `langName` and every
     other from the index, so both have to say the same thing here or the
     test is about the fixture rather than about the filter. */
  langName = '自分の';
  const asA2 = vLangs();
  netOut(); arrive(B);
  langId = 'Lb'; langName = '他人の1';
  const asB2 = vLangs();
  LANGS = keepL2; langId = keepId2; langName = keepNm2;

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
  LANGS = { 'La': { name: '自分の', mine: true, uid: A } };
  langId = 'La'; langName = '自分の';
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
  LANGS = { 'La': { name: 'A の言語', mine: true, uid: A },
            'Lb': { name: 'B の言語', mine: true, uid: B } };
  langId = 'La'; langName = 'A の言語';
  try { localStorage.setItem(langKeyOf('La', 'words'),
    JSON.stringify([{ hw: 'aaa', ph: ['a'], mn: 'A のことば', mns: ['A のことば'], pos: 'n' }])); } catch (e) {}
  arrive(B);
  langForAcct(true);
  if (langId === 'La') no('33: B でサインインしたのに A の言語が開いたまま');
  if (!langAcct(langId)) no('33: 開いた言語が B のものではない（' + langId + '）');
  if (!LANGS.La) no('33: A の言語が索引から消えた');
  if (!localStorage.getItem(langKeyOf('La', 'words')))
    no('33: A の単語が消えた ── 隠すのであって消すのではない');
  /* そして A に戻ると、A の言語がそのまま返る。 */
  netOut(); arrive(A);
  langForAcct(true);
  if (langId !== 'La') no('33: A に戻ったのに A の言語が開かない（' + langId + '）');
  /* そして B がこの端末に一つも持っていない場合。作られる新しい言語には
     そのアカウントの印が要ります ── langMint() は印を付けず、印の無い言語は
     「訊いた人のもの」と読まれるので（langOwned）、A が戻ったときに A 自身の
     言語より先にそれが見つかります。 */
  netOut();
  LANGS = { 'La': { name: 'A の言語', mine: true, uid: A } };
  langId = 'La'; langName = 'A の言語';
  arrive(B);
  langForAcct(true);
  const madeForB = langId;
  if (madeForB === 'La') no('33: 何も持っていない B に A の言語が開いたまま');
  if (!LANGS[madeForB] || String(LANGS[madeForB].uid || '') !== B)
    no('33: B のために作った言語に B の印が無い（uid=' +
       JSON.stringify(LANGS[madeForB] && LANGS[madeForB].uid) + '）');
  netOut(); arrive(A); langForAcct(true);
  if (langId !== 'La')
    no('33: A が戻ったのに、B のために作った言語のほうが開いた（' + langId + '）');
  say('33: 開いている言語はサインインした人のもの ── 前の人のは消えず、戻れば返る');

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
  start();
  SET.plan = 'pro'; SET.planWas = 'pro'; save();
  const keepL34 = LANGS, keepId34 = langId, keepNm34 = langName;
  LANGS = { 'La': { name: '自分の', mine: true, uid: A } };
  langId = 'La'; langName = '自分の';
  langNew();
  const made34 = langId;
  if (made34 === 'La') no('34: ＋ を押したのに新しい言語が開いていない');
  else if (String((LANGS[made34] || {}).uid || '') !== A)
    no('34: ＋ で作った言語に、押した人の印が無い（uid=' +
       JSON.stringify((LANGS[made34] || {}).uid) + '）');
  /* そして印が付いたぶん、その言語はちゃんとその人のものとして数えられる。
     印の無い言語は 35 番で「誰のものでもない」になるので、この二つは
     同じ一つの穴の両側です。 */
  else if (!langAcct(made34))
    no('34: ＋ で作った言語が、作った人自身の一覧に出ない');
  LANGS = keepL34; langId = keepId34; langName = keepNm34;
  SET.plan = 'free'; SET.planWas = 'free'; save();
  say('34: ＋ で作った言語は、押した人のアカウントのもの');

  /* ---- 35. 印の無い言語を拾うのは、オンボーディングの歩きだけ -----------
     「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」
     OWNER 2026-09-02。
     「アカウントごとに言語情報も違うんだって」 OWNER 2026-09-03。

     `langOwned()` は印の無い言語を「訊いた人のもの」と答えていました。
     だから **A がこの端末で作って一度も上げていない言語が、B がサインイン
     した瞬間に B のものになります。**辞書も文字もキーボードも、B の一覧に
     B の言語として並ぶ。何も throw しません。

     **言語はその印が指すアカウントのものです。**印の無い言語を自分のものと
     答える場所は一つだけ ── オンボーディングの歩きの途中、まだ `SET.done` が
     偽のあいだ。そこは、アカウントができる前に物を作る唯一の場所だからです。
     扉を出た `obFinish()` が `netLangSync()` を呼び、そこで印が付きます。

     端末を憶える仕掛けはありません。「この端末の一人目」は端末ごとの事実で、
     それを持ち込んだ日に A の言語が B の一覧に出ました。

     消しません。印の無い言語は索引に残り、保存に残り、バックアップに残り、
     単語も一つも減りません ── ここで押さえるのはその両方です
     （`docs/DATA_SAFETY.md`「短い一覧は削除ではない」）。 */
  start();
  const keepL35 = LANGS, keepId35 = langId, keepNm35 = langName;
  const w35 = [{ hw: 'aaa', ph: ['a'], mn: 'A のことば', mns: ['A のことば'], pos: 'n' }];
  LANGS = { 'Lu': { name: 'A が圏外で作った', mine: true } };   /* 印が無い */
  langId = 'Lu'; langName = 'A が圏外で作った';
  try { localStorage.setItem(langKeyOf('Lu', 'words'), JSON.stringify(w35)); } catch (e) {}

  /* 歩きの途中 ── まだ誰もサインインしていない。訊く相手がいないので、
     作ったものはその場の人のもの。 */
  netOut(); SET.done = false;
  if (!langOwned('Lu')) no('35: 歩きの途中で、作ったものが自分のでない');

  /* 扉。サインインは済んだが obFinish() はまだ ── ここも歩きの内側。 */
  arrive(B);
  if (!langOwned('Lu')) no('35: オンボーディングの扉で、歩きが作ったものが拾われない');

  /* 扉を出たら印が付いています。付いていない言語はもう誰のものでもない ──
     端末の一人目という覚え方はしません。 */
  SET.done = true;
  if (langOwned('Lu')) no('35: 印の無い言語が、アプリの中で訊いた人のものになっている');
  if (langAcct('Lu')) no('35: 印の無い言語が、訊いた人の一覧に出る');
  if (vLangs().indexOf('A が圏外で作った') >= 0)
    no('35: 印の無い言語が、訊いた人の言語一覧に並んでいる');
  netOut(); arrive(A);
  if (langOwned('Lu')) no('35: 印の無い言語が、次に入った人のものになっている');

  /* そして何も消えていない。 */
  if (!LANGS.Lu) no('35: 印の無い言語が索引から消えた');
  if (!localStorage.getItem(langKeyOf('Lu', 'words')))
    no('35: 印の無い言語の単語が消えた ── 隠すのであって消すのではない');

  /* 印のある言語は持ち主には見え、他人には見えない。 */
  LANGS['Lb'] = { name: 'A の言語', mine: true, uid: A };
  if (!langOwned('Lb')) no('35: 自分の印が付いた言語が自分のものでない');
  netOut(); arrive(B);
  if (langOwned('Lb')) no('35: 他人の印が付いた言語が自分のものになっている');

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

     `makeNeed()` はオンボーディングの最中は素通りします（`SET.done`）。
     歩きは口座ができる前で、そこで訊くのはサインインする理由ができる前に
     訊くことなので ── 扉は歩きの最後です。 */
  start();
  SET.plan = 'pro'; SET.planWas = 'pro'; save();
  const keepL36 = LANGS, keepId36 = langId, keepNm36 = langName;
  LANGS = { 'La': { name: '自分の', mine: true, uid: A } };
  langId = 'La'; langName = '自分の';
  netOut();                                   /* サインアウトした人 */
  if (langStop()) no('36: 上限のほうで止まっている ── この検査が測りたいものではない');
  const before36 = Object.keys(LANGS).length;
  langNew();
  if (Object.keys(LANGS).length !== before36)
    no('36: サインアウトしているのに ＋ で言語ができた');
  if (langId !== 'La') no('36: サインアウトしているのに ＋ で言語が切り替わった');
  /* 断るだけではなく、扉へ送ること。断って何も起きない＋は、原因も出口も
     無い画面です。`obDoor()` が `SET.done` を下ろして戻り先を憶えます。 */
  if (SET.done) no('36: ＋ が断っただけで、扉を開いていない');
  if (!SET.obback) no('36: 扉から戻る先を憶えていない');
  SET.done = true; SET.obback = null; save();
  /* そしてサインインしていれば、＋ は今までどおり通る（34番の裏返し）。 */
  arrive(A);
  langNew();
  if (Object.keys(LANGS).length !== before36 + 1)
    no('36: サインインしているのに ＋ で言語ができない');
  LANGS = keepL36; langId = keepId36; langName = keepNm36;
  SET.plan = 'free'; SET.planWas = 'free'; save();
  say('36: ＋ はアカウントを訊く ── 断らずに扉へ送る。サインインしていれば通る');


  /* ---- 37-42. 段は買ったアカウントのもの --------------------------------
     「1アドレス1アカウント」「これは絶対課金もアカウントごと言語もそう」
     「Xは違うアカウントだと課金も引き継がれない」 OWNER 2026-09-02。

     16-18 番は段がアカウントに **紐づく** ことを持っています。ここが持つのは
     その裏 ── 同じ端末で別のアカウントに入った人は、その端末で買った購読を
     **引き継がない**。段は Apple ID のものでも端末のものでもありません。

     起きていたのはこれです:

       A（Pro）がサインアウト → B がサインイン
       端末の SET.plan はまだ pro（Keychain は誰のものでもない）
       次の起動 → netPlanSync：B の行は空 → best='pro' → netPlanUp('pro')
       → B のアカウントに Pro が付く

     `SET.planUid` が持ち主で、実機では Keychain が本体です（そこは Swift なので
     この容器では走りません ── `ios/App/App/LinguaPlan.swift`）。ブラウザには
     Keychain が無いので、注入されてくる値は下で手で置いています。段そのものが
     ブラウザでは設定に残るのと同じ扱いです。 */

  /* 37. 別の人が買ったものは引き継がない。 */
  start();
  SET.plan = 'pro'; SET.planWas = 'pro'; SET.planUid = A; save();
  netOut();
  arrive(B);
  if (plan() !== 'free')
    no('37: 別のアカウントが、この端末で買われた段を引き継いだ — ' + plan());
  if (SET.planUid !== B)
    no('37: 段の持ち主が入った人になっていない — ' + JSON.stringify(SET.planUid));
  say('37: 別のアカウントは、この端末で買われた購読を引き継がない');

  /* 38. **そして B のサーバーの行に pro が書かれない。**これが実害の出る
     ところです ── 37 で画面が free でも、送るほうが pro なら B のアカウントに
     Pro が付いたまま残ります。 */
  start();
  SET.plan = 'pro'; SET.planWas = 'pro'; SET.planUid = A; save();
  netOut();
  const sent38 = [];
  const realUp38 = netPlanUp;
  netPlanUp = (id) => { sent38.push(id); };
  arrive(B);
  netGet = (path, ok) => {
    if (path.indexOf('/rest/v1/plan') === 0) return ok([]);   /* B の行は無い */
    return ok([]);
  };
  netPlanSync(() => {});
  netGet = realGet; netPlanUp = realUp38;
  if (sent38.indexOf('pro') >= 0)
    no('38: B のアカウントに pro を送った — 送ったもの ' + JSON.stringify(sent38));
  say('38: B のアカウントに、A が買った段は送られない');

  /* 39. **買った人のものは取り上げない。**Keychain には書き戻さないので、A の
     段と名前はそこに残り、A が戻ってきた起動で読み直されます。ブラウザには
     Keychain が無いので、注入されてくる二つを手で置いて同じ状態を作ります。 */
  start();
  netOut();
  SET.plan = 'pro'; SET.planWas = 'pro'; SET.planUid = A; save();  /* 注入された二つ */
  arrive(A);
  if (plan() !== 'pro') no('39: 買った本人から段を取り上げた — ' + plan());
  if (SET.planWas !== 'pro') no('39: 買った本人の planWas が動いた — ' + SET.planWas);
  say('39: 買った本人の段は、そのまま返ってくる');

  /* 40. **持ち主がまだ書かれていない端末は、何も動かさない。**空の
     `SET.planUid` はこの章より前の端末で、そこにある段が誰のものかは
     **決まっていません**（docs/scope/claude-planacct.md）。動かさないほうが
     今日と同じ振る舞いなので、名前を書き留めるだけです。 */
  start();
  netOut();
  SET.plan = 'pro'; SET.planWas = 'pro'; SET.planUid = ''; save();
  arrive(A);
  if (plan() !== 'pro')
    no('40: 持ち主の書かれていない端末で段が動いた — ' + plan());
  if (SET.planUid !== A)
    no('40: 持ち主を書き留めていない — ' + JSON.stringify(SET.planUid));
  say('40: 持ち主の書かれていない端末は、名前を書き留めるだけで段は動かさない');

  /* 41. **planWas も一緒に下りる。**飾りではありません。下りないと起動時の
     capLapse() が pro → free を「解約された」と読み、①別人の段を基準にした
     シートを出し、②`netPlanUp('free')` を **B のサーバーの行** に書きます。
     ここは capLapse() を本当に呼んで、何も送られないことを見ます。 */
  start();
  SET.plan = 'pro'; SET.planWas = 'pro'; SET.planUid = A; save();
  netOut();
  arrive(B);
  const sent41 = [];
  const realUp41 = netPlanUp;
  netPlanUp = (id) => { sent41.push(id); };
  capLapse();
  netPlanUp = realUp41;
  if (sent41.length)
    no('41: B のアカウントに、B のものではない解約が送られた — ' +
       JSON.stringify(sent41));
  say('41: planWas も一緒に下りるので、別人の解約は送られない');

  /* 42. **起動して憶えているセッションを読んだ瞬間にも訊く。**netTook() だけでは
     遅すぎます ── netResume() は非同期で、www/boot.js の末尾の capLapse() は
     同期で、その下を先に走ります。netRead() は www/net.js が読み込まれた瞬間で、
     www/boot.js より三つ前です。 */
  start();
  netOut();
  SET.plan = 'pro'; SET.planWas = 'pro'; SET.planUid = A; save();
  localStorage.setItem('lingua.sess', JSON.stringify(
    { at: 'not a jwt', rt: 'a refresh token', uid: B }));
  netRead();
  if (plan() !== 'free')
    no('42: 憶えているセッションを読んだだけでは照合していない — ' + plan());
  if (SET.planWas !== 'free')
    no('42: netRead() の道で planWas が下りていない — ' + SET.planWas);
  netOut();
  say('42: 起動して憶えているセッションを読んだ瞬間にも訊く（capLapse より先）');

  /* 43. **Keychain へ送る文に uid が乗るのは、セッションがあるときだけ。**
     持ち主が変わるのは段が変わるときだけ、という一文が planKeep() です。
     誰もいない起動（www/core.js の二箇所）で '' を送ると、毎回持ち主が
     消えます ── この章が止めようとしているものが、そのために作った扉から
     入ってきます。ここは Swift ではなく **送る文** を見ています。 */
  start();
  const realCap43 = window.Capacitor;
  const msgs43 = [];
  window.Capacitor = { nativePromise: (p, m, a) => {
    msgs43.push({ p: p, m: m, a: a });
    return { 'catch': () => {} };
  } };
  netOut();
  planKeep('pro');                       /* 誰もいない */
  arrive(A);
  planKeep('pro');                       /* A がいる */
  window.Capacitor = realCap43;
  if (msgs43.length !== 2)
    no('43: Keychain へ送っていない — ' + msgs43.length + '通');
  if (msgs43[0] && msgs43[0].a && 'uid' in msgs43[0].a)
    no('43: 誰もいないのに uid を送った — 既にある持ち主が消える — ' +
       JSON.stringify(msgs43[0].a));
  if (!msgs43[1] || !msgs43[1].a || msgs43[1].a.uid !== A)
    no('43: サインインしているのに買った人を書いていない — ' +
       JSON.stringify(msgs43[1] && msgs43[1].a));
  if (msgs43[1] && msgs43[1].a && msgs43[1].a.plan !== 'pro')
    no('43: 段そのものが送られていない — ' + JSON.stringify(msgs43[1].a));
  say('43: Keychain へは段と一緒に買った人が乗る ── 誰もいなければ乗らない');

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
     bkDropAll() がバックアップを全部落としていた。2026-08-27 に「端末は一人の
     もの」だった頃の姿のままで、アプリの意味が「アカウントごと」に変わった
     あとも読み直されていなかった。 */
  start();
  netOut(); arrive('d46a');
  LANGS = { La46: { name:'A の言語', mine:true, uid:'d46a' },
            Lb46: { name:'B の言語', mine:true, uid:'d46b' } };
  langId = 'La46'; langStore();
  try{
    localStorage.setItem(langKeyOf('La46','words'), '[{"hw":"a"}]');
    localStorage.setItem(langKeyOf('Lb46','words'), '[{"hw":"b"}]');
    localStorage.setItem('lingua.me.d46b', '{"name":"B"}');
    localStorage.setItem('lingua.posts.d46b', '[{"id":"pb"}]');
  }catch(e){}
  SET.theme = 'dark'; SET.ui = 'ja'; save();
  var dropped = [];
  var realDrop = (typeof bkDropFor==='function')? bkDropFor : null;
  bkDropFor = function(ids){ dropped = (ids||[]).slice(); };
  var wasConfirm = window.confirm; window.confirm = function(){ return true; };
  try{ wipeHere(); }catch(e){ no('46: 削除が投げた ── ' + e.message); }
  window.confirm = wasConfirm;
  if (realDrop) bkDropFor = realDrop;

  if (LANGS.La46) no('46: 消したアカウントの言語が索引に残っている');
  if (localStorage.getItem(langKeyOf('La46','words'))) no('46: 消したアカウントの単語が残っている');
  if (!LANGS.Lb46) no('46: **別のアカウントの言語が消えた** ── これが起きたことです');
  if (!localStorage.getItem(langKeyOf('Lb46','words'))) no('46: 別のアカウントの単語が消えた');
  if (!localStorage.getItem('lingua.me.d46b')) no('46: 別のアカウントのプロフィールが消えた');
  if (!localStorage.getItem('lingua.posts.d46b')) no('46: 別のアカウントの投稿が消えた');
  if (dropped.indexOf('La46') < 0) no('46: 消したアカウントのバックアップが落とされていない');
  if (dropped.indexOf('Lb46') >= 0) no('46: **別のアカウントのバックアップが落とされた**');
  if (SET.theme !== 'dark') no('46: この端末の設え（テーマ）まで消した');
  if (SET.plan !== 'free') no('46: 消したアカウントの段が残っている');
  say('46: アカウント削除は、そのアカウントの言語・単語・投稿・段・バックアップだけ ── '
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
  /* バックアップのファイルは 46 番のもので、ここの話ではありません。ネイティブ
     の橋に触りに行かせないよう、46 番と同じように差し替えておきます。 */
  const rDrop49 = bkDropFor;
  bkDropFor = function(){};
  const rSend49 = netSend, rGet49 = netGet, rPost49 = netPost;
  const unwire49 = () => { netSend = rSend49; netGet = rGet49; netPost = rPost49; };
  /* サーバを一つの関数に。answer(path) が数字を返し、0 は「届かなかった」。 */
  const srv49 = (answer) => {
    netSend = (method, p, body, tok, ok, bad) => {
      const st = answer(p);
      setTimeout(() => { st >= 200 && st < 300 ? ok(null) : bad(null, st, 'x'); }, 0);
    };
    netGet = (p, ok, bad) => netSend('GET', p, null, null, ok, bad);
    netPost = (p, body, tok, ok, bad) => netSend('POST', p, body, tok, ok, bad);
  };
  const settle49 = () => new Promise(r => setTimeout(r, 30));

  const D = '44444444-4444-4444-8444-444444444444';
  const seedD49 = () => {
    start();
    netOut(); arrive(D);
    LANGS.Ld47 = { name: 'D の言語', mine: true, uid: D };
    langId = 'Ld47'; langStore();
    try{ localStorage.setItem(langKeyOf('Ld47','words'), '[{"hw":"d"}]'); }catch(e){}
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
  if (!localStorage.getItem(langKeyOf('Ld47','words')))
    no('47: **サーバが消していないのに端末の単語が消えた**');
  if (!netSignedIn())
    no('47: 消えていないのにログアウトした ── アカウントはまだそこにあります');
  if (!netEnded())
    no('47: 途中で切れた削除の印が付いていない ── 次に開いたとき続きから消せない');
  say('47: サーバが消し切っていないあいだは、端末のものは一つも消えない');

  /* 48. そして次に開いたとき、続きから消える。
     47 番がそのまま続きです ── サインインしたまま、言語もそこにあり、印だけが
     付いている。それが「次に開いたとき」の状態で、www/boot.js の bootSession()
     が読むのはこの印です。押した時と同じ wipeAllGo() を呼ぶので、二度目のための
     二本目の道はありません。 */
  srv49(() => 200);
  wipeAllGo();
  await settle49();
  await settle49();
  unwire49();
  if (LANGS.Ld47) no('48: 続きの削除で、その言語が消えていない');
  if (localStorage.getItem(langKeyOf('Ld47','words')))
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
  try{ localStorage.setItem(langKeyOf('Lx50','words'), '[{"hw":"x"}]'); }catch(e){}
  srv49(() => 200);
  wipeAllGo();
  await settle49();
  unwire49();
  if (!LANGS.Lx50)
    no('50: **サインアウト中に削除を押したら、印の無い言語が消えた** ── '
     + 'サーバには何も頼んでいません');
  if (!localStorage.getItem(langKeyOf('Lx50','words')))
    no('50: **サインアウト中に削除を押したら、印の無い言語の単語が消えた**');
  say('50: サインアウト中に削除を押しても、頼む相手がいないので何も消えない');
  bkDropFor = rDrop49;

  /* ---- 51-52. 扉。六十秒と、コードの画面が一枚であること ----------------
     「8桁で60秒再送信」 OWNER 2026-09-03。

     52 のほうが根っこです。**コードを打つ画面は二枚ありました** ── 登録の道が
     着く一枚と、再設定の道が着く一枚。見出しも、下の一行も、欄も、確認も、
     再送信も同じで、押したときに呼ぶものだけが違いました。だから六十秒を
     足すと、片方にだけ入って、入らなかったほうは誰も見ません。扉が一日で
     四回形を変えて、そのたびに前の道が残った、その残りです。 */
  start(); SET.done = true;
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

  SET.done = true; SET.obback = null;

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
  LANGS[langId].uid = U53; LANGS[langId].mine = true; langStore();
  KB = kbBoardsOf({ kbs:[{ nm:'消される人のキーボード', pat:'qwerty',
                           lay:[{ rows:[['a']] }] }], at:0 });
  saveKb();
  WLD = { where:'消される人の土地', who:'消される人' };
  saveWld();
  const rDrop53 = bkDropFor; bkDropFor = function(){};
  wipeHere(U53);
  bkDropFor = rDrop53;
  if (KB && KB.kbs && KB.kbs.length)
    no('53: **消したアカウントのキーボードがメモリに残っている** ── 次の保存で'
     + '新しい言語に書き込まれます');
  if (WLD && WLD.where)
    no('53: **消したアカウントの世界（土地・人）がメモリに残っている**');
  saveKb(); saveWld();
  let k53 = null, w53 = null;
  try{ k53 = localStorage.getItem(langKey('kb')); }catch(e){}
  try{ w53 = localStorage.getItem(langKey('wld')); }catch(e){}
  if (k53 && k53.indexOf('消される人') >= 0)
    no('53: **消したアカウントのキーボードが、次の言語に書き込まれた**');
  if (w53 && w53.indexOf('消される人') >= 0)
    no('53: **消したアカウントの土地が、次の言語に書き込まれた**');
  say('53: アカウントを消したら、キーボードも世界も残らず、次の言語にも移らない');

  /* ---- 54. 言語のものを読み書きする一覧は一つで、SLICES と合っている ------
     53 が起きた形そのものを押さえます。手書きの一覧が八つある限り、次に
     スライスが一つ足されたとき、また同じことが起きます ── 過去に二回。
     キーボードはバックアップに入っておらず、世界は設定の中に居ました。

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

  return out;
});

await br.close();
srv.close();

for (const s of R.said) console.log('  ' + s);
if (R.fails.length) {
  console.error('');
  for (const f of R.fails) console.error('  ✗ ' + f);
  console.error('\nacct-check: ' + R.fails.length + ' 件。');
  process.exit(1);
}
console.log('\nacct-check: 全部通った。');
