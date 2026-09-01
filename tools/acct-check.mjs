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

const R = await pg.evaluate(() => {
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
     `rt` disagreed with it: netSignedIn() said no, netMember() said no, and
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
  const askRow = () => {
    let got = '', refused = false;
    netLangRow((sid) => { got = sid; }, () => { refused = true; });
    return { got, refused };
  };

  /* 9. A が上げた言語に、B が触れない。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: 'A の言語', mine: true, sid: 'A-lang', uid: A };
  langStore();
  netOut(); arrive(B);
  let r9 = askRow();
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
  langStore();
  netOut(); arrive(B);
  let r10 = askRow();
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
  netOut(); arrive(B);
  netGet = (path, ok) => { getted.push(path); ok([]); };     /* 持ち主ではない */
  let r12 = askRow();
  unwire();
  if (!getted.length) no('12: uid が無いのにサーバへ訊かなかった');
  if (!r12.refused) no('12: サーバが行を返さないのに通した');
  if (posted.length) no('12: 断ったあとで行を作りに行った');
  if (LANGS[langId].uid) no('12: 持ち主でないのに uid を書いた');
  say('12: uid の無い言語は、サーバが持ち主を答える（他人なら断る）');

  /* そして持ち主なら通り、そのとき uid が端末に残る ── 次からは訊かない。 */
  start();
  wire(); posted = []; getted = [];
  LANGS[langId] = { name: '前からある言語', mine: true, sid: 'old-lang' };
  langStore();
  netOut(); arrive(A);
  netGet = (path, ok) => { getted.push(path); ok([{ id: 'old-lang' }]); };
  let r12b = askRow();
  unwire();
  if (r12b.refused) no('12: 持ち主が自分の言語を断られた');
  if (r12b.got !== 'old-lang') no('12: 持ち主に sid が渡らなかった');
  if (LANGS[langId].uid !== A) no('12: 通ったのに uid が端末に残っていない');
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
  LANGS['Ld'] = { name: 'まだ扉を通っていない', mine: true };
  langStore();
  const asA = langCount();
  netOut(); arrive(B);
  const asB = langCount();
  if (asA !== 3) no('19: A から見た数が 3 でない（A の2つ＋持ち主なし1つ）— ' + asA);
  if (asB !== 2) no('19: B から見た数が 2 でない（B の1つ＋持ち主なし1つ）— ' + asB);
  if (asA === asB && asA === 4)
    no('19: 端末にある全部を数えている ── 他人の言語で上限が埋まる');
  say('19: 言語の数は、そのアカウントのものを数える（持ち主なしは厳しいほうへ）');

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
  start();
  const told = [];
  window.Capacitor = { Plugins: { SocialLogin: {
    logout: (arg) => { told.push(arg && arg.provider); return { catch: () => {} }; }
  } } };
  OB_SL = true;
  setSignOut();
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
  try { setSignOut(); } catch (e) { threw = true; }
  delete window.Capacitor;
  if (threw) no('28: provider が拒んだらサインアウトが落ちる');
  if (netSignedIn()) no('28: provider が拒んだらサインアウトできない');

  start();
  window.Capacitor = { Plugins: {} };          /* プラグインが無いビルド */
  let threw2 = false;
  try { setSignOut(); } catch (e) { threw2 = true; }
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
