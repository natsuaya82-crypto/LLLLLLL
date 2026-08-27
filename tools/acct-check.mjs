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
     The half that is easy to lose while fixing the half above. `bio`, `link`
     and `loc` exist nowhere but this phone -- netMakeProfile() sends handle,
     display and av and nothing else -- so if signing somebody else in threw
     them away, they are gone for good. */
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
  say('3: 二人が同じ電話を使っても、互いのものは見えない');

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
  const gone   = netWhy(null, 0);                    /* never left the phone */
  const unsent = netWhy(null, 0, 'mkprofile');       /* never made at all */
  const notSess= netWhy({}, 0, 'token', true);       /* 200, and not a session */
  if (gone === unsent)
    no('6: 「届かなかった」と「送っていない」が同じ文言 — ' + JSON.stringify(gone));
  if (gone === notSess || unsent === notSess)
    no('6: 「セッションではなかった」が他と同じ文言 — ' + JSON.stringify(notSess));
  say('6: status 0 の三つの道が、画面で見分けられる');
  say('   届かない  : ' + gone);
  say('   送ってない: ' + unsent);
  say('   session≠ : ' + notSess);

  /* ---- 7. a real status is still a real status -------------------------
     The marks must not have eaten the ordinary answers. */
  if (netWhy({ msg: 'Invalid login credentials' }, 400) === gone)
    no('7: 400 が offline の文言になっている');
  say('7: 0 でない status は、これまでどおりの文言');

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
