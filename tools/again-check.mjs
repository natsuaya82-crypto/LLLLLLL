/* A language comes back on a phone that has never seen it.
   ---------------------------------------------------------------------
   「基本は全部サーバー管理」「アカウント消したら残るわけがない」 OWNER
   2026-08-26. The server is the record and the phone is the copy that works
   with no signal — and `netOut()` only drops the session, so on the SAME
   phone signing back in finds everything in localStorage and the claim looks
   true. On a new phone it was not: nothing in `www/` had ever read a
   `language` row back, so `LANGS` came up empty, `sid` was gone, and
   `netLangRow()` made a SECOND language on the server. The first one stayed
   there with nothing pointing at it.

   The same root, twice: `netLangSync()` read `langId` — the one language that
   happens to be open — so a second or third language never went up at all.
   There was nothing to come back.

   What is stubbed is `netSend()`, and only that: it is the one place every
   request in www/net.js goes through, so everything above it — netLangRow,
   netSlices, netSlicePut, the merge — runs for real against a server made of
   two arrays. A check that stubbed netSlices or netLangSync would be asking
   its own answer back (CLAUDE.md rule 12).

   Run: node tools/again-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

/* ---- a server made of two arrays, behind the one transport -------------- */
const SERVER = `
  window.__SRV = { lang:[], slice:[], take:[], n:0, down:false, sent:[], tried:[],
                   /* WHAT IS IN THE AIR RIGHT NOW, by name. NET_OUT is a
                      COUNT and a count cannot say which request is the one
                      still out -- which is the only thing worth printing when
                      「the mark did not come down」. Pushed when the request
                      goes out and taken off when either half answers, which
                      is the same pair of moments netOn()/netOff() are. */
                   air:[] };
  netSend = function(method, p, body, tok, ok, bad){
    var S = window.__SRV;
    /* A WIRE SAYS HOW MANY REQUESTS IT IS HOLDING, and this stands in for the
       wire. netOn()/netOff() are the app's own counter (www/net.js § NET_OUT)
       and are what tells 「答えを待っている」 from 「訊くものが無かった」 --
       ［再接続］ reads it to decide whether the mark turns. Calling them here
       is not a second rule: it is this stub playing the part it took over.
       The real one stamps the XMLHttpRequest, so anything with a place to put
       the stamp will do. */
    var wire = {};
    netOn(wire);
    var name = method + ' ' + p;
    S.air.push(name);
    function landed(){
      var k = S.air.indexOf(name);
      if (k >= 0) S.air.splice(k, 1);
      netOff(wire);
    }
    var realOk = ok, realBad = bad;
    ok = function(v){ landed(); realOk(v); };
    bad = function(d, st, m){ landed(); realBad(d, st, m); };
    /* WHAT WAS ASKED, before it is decided whether it is answered. S.sent is
       written inside each route and so records only what got through -- which
       is the right list for 「did this arrive」 and the wrong one for 「did
       the app even try」. A save that is refused has to be seen to have gone
       out, or 「押した瞬間に出て行く」 cannot be told from 「never sent」. */
    S.tried.push(method + ' ' + p);
    if (S.down){ setTimeout(function(){ bad(null, 0, 'down'); }, 0); return; }
    /* The write that actually carries a person's work, refused on its own.
       It is not a contrived case: the language row is already known and the
       GET of the slices is cached or small, so the POST is the request most
       likely to be the one that does not make it. */
    if (S.downSlice && method === 'POST' && p.indexOf('/rest/v1/slice') === 0){
      setTimeout(function(){ bad(null, 0, 'down'); }, 0); return;
    }
    /* そして取った言語の ask だけを落とす。全部落とすと「答えが来ていない
       起動では何も落ちない」が、何も降りてこなかったことを測るだけの主張に
       なります（www/core.js § LTAKE ── null は「無い」ではない）。 */
    if (S.downTake && method === 'GET' && p.indexOf('/rest/v1/language_take') === 0){
      setTimeout(function(){ bad(null, 0, 'down'); }, 0); return;
    }
    function answer(v){ setTimeout(function(){ ok(v); }, 0); }
    /* AND WHAT THIS ACCOUNT PAYS. The door asks \`verify-plan\` now
       (www/net.js § netTook, 2026-09-11), and until it answers this app has
       no plan at all -- ltStart() does not write the free alphabet, and every
       ceiling says 「接続できません」 (www/core.js § PLAN). A real server
       answers \`free\` for somebody who has bought nothing, which is every
       account in this file. */
    if (p.indexOf('/functions/v1/verify-plan') >= 0) return answer({ plan:'free' });
    function arg(k){
      var m = new RegExp('[?&]' + k + '=eq\\\\.([^&]*)').exec(p);
      return m ? decodeURIComponent(m[1]) : '';
    }
    /* THE ID COMES IN THE INSERT AND THE COLUMN'S DEFAULT ONLY FIRES WHERE
       NOTHING WAS SENT -- which is what PostgREST does with a primary key,
       and what the whole of 2026-09-10 is about (a language has ONE number
       and the phone writes it). A stub that minted its own here would be a
       server that ignores what it was sent, and the check would be measuring
       an app nobody ships.
       AND A SECOND ROW UNDER ONE ID IS A 409, because the id is the primary
       key. netLangRow() reads that as 「it is already here」. */
    if (method === 'POST' && p.indexOf('/rest/v1/language') === 0){
      var id = String((body && body.id) || ('srv' + (++S.n))), g;
      for (g = 0; g < S.lang.length; g++) if (S.lang[g].id === id){
        setTimeout(function(){ bad(null, 409, 'language 409'); }, 0); return;
      }
      S.lang.push({ id:id, owner:body.owner, name:body.name || '', published_at:null });
      S.sent.push('language:' + id);
      return answer([{ id:id }]);
    }
    if (method === 'PATCH' && p.indexOf('/rest/v1/language') === 0){
      var lid = arg('id'), j;
      /* 送られた欄だけを書きます。両方を毎回書くと、名前の PATCH が
         published_at を undefined で消し、公開が黙って落ちます ── これは
         PostgREST の実際のふるまいでもあります。 */
      for (j = 0; j < S.lang.length; j++) if (S.lang[j].id === lid){
        if (body && body.published_at !== undefined) S.lang[j].published_at = body.published_at;
        if (body && body.name !== undefined) S.lang[j].name = body.name;
      }
      return answer([]);
    }
    if (method === 'POST' && p.indexOf('/rest/v1/slice') === 0){
      var rows = (body instanceof Array) ? body : [body], k, r, f, hit;
      for (k = 0; k < rows.length; k++){
        r = rows[k]; hit = null;
        for (f = 0; f < S.slice.length; f++)
          if (S.slice[f].language === r.language && S.slice[f].kind === r.kind) hit = S.slice[f];
        if (hit){ hit.body = r.body; hit.no = r.no; hit.at = r.at; }
        else S.slice.push({ language:r.language, kind:r.kind, body:r.body,
                            no:r.no, at:r.at });
        S.sent.push('slice:' + r.language + ':' + r.kind);
      }
      return answer([]);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/slice') === 0){
      /* at を返します ── サーバーがその slice を最後に書いた印で、保存が
         中身を読まずに済ませられるかはこれで決まります（www/net.js
         § netAtSame）。返さない偽サーバーは「印を知らない」端末を作るので、
         いつまでも中身を読む道しか歩かれません。 */
      var want = arg('language'), out = [], q;
      for (q = 0; q < S.slice.length; q++) if (S.slice[q].language === want)
        out.push({ kind:S.slice[q].kind, body:S.slice[q].body,
                   no:S.slice[q].no, at:S.slice[q].at });
      return answer(out);
    }
    /* 取った言語の表 ── language_take。この人の行だけ（take_read は
       uid = auth.uid()）。空の一覧は答えで、「まだ訊いていない」では
       ありません（www/core.js § LTAKE、2026-09-09）。 */
    if (method === 'GET' && p.indexOf('/rest/v1/language_take') === 0){
      var tk = arg('uid'), tout = [], t;
      for (t = 0; t < S.take.length; t++) if (S.take[t].uid === tk)
        tout.push({ language:S.take[t].language });
      return answer(tout);
    }
    if (method === 'GET' && p.indexOf('/rest/v1/language') === 0){
      /* language_read: 自分のもの、または誰のでも **公開されている** もの。
         起動は二度訊きます ── 自分の行は owner=eq.<自分> ですぐに、取った
         言語の行は language_take の答えが来た時に id=in.(…) で。取った言語
         でも公開されていなければ来ない、というのがこの表の規則です。 */
      var own = arg('owner'), ids = null, mi, o2 = [], z, L;
      mi = /[?&]id=in\\.\\(([^)]*)\\)/.exec(p);
      if (mi) ids = mi[1] ? mi[1].split(',').map(function(x){ return decodeURIComponent(x); }) : [];
      for (z = 0; z < S.lang.length; z++){
        L = S.lang[z];
        if (ids){
          if (ids.indexOf(L.id) < 0) continue;
          if (L.owner !== own && !L.published_at) continue;
        } else if (L.owner !== own) continue;
        o2.push({ id:L.id, owner:L.owner, name:L.name, wsys:L.wsys || '',
                  published_at:L.published_at });
      }
      return answer(o2);
    }
    return setTimeout(function(){ bad(null, 404, 'no route ' + method + ' ' + p); }, 0);
  };
  /* netSlicePut() used to open its own XMLHttpRequest, so it was a SECOND
     transport this stub could not see and had to be replaced here as well.
     On 2026-09-02 it moved onto netSend() -- it differed by one header and by
     being outside the token renewal -- so the stub above is now the only
     transport again, and nothing extra is needed. */
`;

/* ---- 1. two languages, one of them not open ----------------------------- */
const up = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  /* the one the fixture made is open; a second one beside it, written and
     then LEFT — which is the ordinary state of a person's other language */
  var first = langId;
  /* 名前は `language.name` です（www/core.js § LNAME）。langNameGot() は
     行が上がるとき・降りてくるときに書かれる一つの道で、ここは「この端末は
     この言語をこう呼んでいる」を置いているだけ ── `langName` への直書きは
     開いている言語しか動かせず、開いていない方の名前は誰も言えません。 */
  langNameGot(first, 'Vaska'); save();
  /* 素の mint ── langNew() は上限とアカウントを訊くので、ここでは通しません。
     そのぶん、langNew() が打つ「誰が書いたか」の印はここで打ちます
     （www/core.js § LOWN、2026-09-09）。無いと save() が langLocked() で
     断られ、この言語には一文字も入りません。 */
  var second = langMint(); langOwnGot(second, SESS.uid); langStore();
  var was = langId;
  langOpen(second);
  langNameGot(second, 'Toko');
  WORDS = [{ hw:'sula', ph:['s','u','l','a'], mn:'star', mns:['star'], pos:'n', at:1 }];
  save();
  langOpen(was);
  /* AND BOTH OF THEM BELONG TO THE ACCOUNT THAT IS SIGNED IN HERE. A language
     with no `uid` belongs to nobody once SET.walked is true (langOwned), so it
     is in no list, in no count, and -- what this file is about -- in nothing
     langMineIds() hands to netLangSync(). The fixture stamps its own with the
     uid IT signs in as; this check signs in as somebody else two dozen lines
     up, and langMint() is the bare mint rather than langNew(), which is what
     stamps on the real road. Both of those are why this is here rather than
     in the fixture. */
  /* 誰が書いたかはサーバーの列で、`langOwnOf()` が訊きます
     （www/core.js § LOWN、2026-09-09）。索引の `uid` はもう読みません ──
     この検査はここで別のアカウントとしてサインインするので、fixture が
     打った印を、いまサインインしている人のものに置き換えます。 */
  for (var __i in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, __i)) langOwnGot(__i, SESS.uid);
  langStore();
  /* and a language that is only READ, which must never go up */
  langSeenAdd('theirs-1', 'Shango', 'somebody-else');
  slWr(langKeyOf('theirs-1', 'letters'), '[{"id":"x"}]');
  /* 「読んでいるだけ」はサーバーの二つで決まります（2026-09-11）── 書いた人が
     `language.owner`、このアカウントが取ったことが `language_take` の行。
     後者は `netTakes()` が降ろすもので、この検査は網を張らないので押します。 */
  langTookGot(['theirs-1']);

  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(120);

  var S = window.__SRV, names = S.lang.map(function(r){ return r.name; }).sort();
  return {
    first: first, second: second,
    rows: S.lang.length, names: names,
    /* THE ROWS THE SERVER HAS, BY ID. A language has one number and the phone
       writes it (2026-09-10), so the row's id IS the id the index is keyed by
       -- this used to read `LANGS[x].sid` and put the two side by side. */
    sids: [S.lang.filter(function(r){ return r.id === first; }).length,
           S.lang.filter(function(r){ return r.id === second; }).length],
    /* every slice that went up, by language */
    upFirst: S.slice.filter(function(r){ return r.language === first; }).length,
    upSecond: S.slice.filter(function(r){ return r.language === second; }).length,
    theirsSent: S.sent.filter(function(x){ return x.indexOf('theirs-1') >= 0; }).length,
    theirsRow: langWhose('theirs-1') === LW_READ,
    srv: JSON.stringify({ lang:S.lang, slice:S.slice })
  };
}, { s: seed.toString(), srv: SERVER });

console.log('');
say(up.rows === 2, 'both of a person’s languages are on the server, the open one ' +
    'and the one they are not looking at: ' + up.rows + ' rows (' + up.names.join(', ') + ')');
say(up.sids[0] === 1 && up.sids[1] === 1,
    'and each row is under the number the phone already calls that language by, ' +
    'so nothing makes a second row later: ' + JSON.stringify(up.sids) + ' rows each');
say(up.upFirst > 0 && up.upSecond > 0,
    'with the slices of both: ' + up.upFirst + ' and ' + up.upSecond);
say(up.theirsRow && up.theirsSent === 0,
    'and a language that is only READ went nowhere — syMerge adds both sides, ' +
    'and one pass would put something into a language somebody else wrote (' +
    up.theirsSent + ' requests about it)');

/* ---- 2. a new phone: nothing in storage, the same person signs in ------- */
const back = await pg.evaluate(async ({ s, srv, saved }) => {
  /* the phone is replaced: every byte of localStorage is gone. The server is
     the only thing left, which is the whole claim. */
  localStorage.clear();
  return { srv: saved };
}, { s: seed.toString(), srv: SERVER, saved: up.srv });
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const came = await pg.evaluate(async ({ srv, saved }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }

  var before = Object.keys(LANGS).length;
  /* signing in is netTook() -- the one place that knows a session arrived */
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  var ids = Object.keys(LANGS), i, j, out = [], v, n, b;
  for (i = 0; i < ids.length; i++){
    /* WHAT CAME BACK, MEASURED OVER EVERY SLICE AND NOT OVER `words`.
       ここは `words` の長さだけを数えて「2 本以上が 2 バイトを超えている」と
       訊いていました。開いていた方の言語は `words` が空なので、緑にしていた
       のは **同じ言語が索引に二つ入っていたこと** です（起動の二本の道が
       競争して両方が langMint() していた）。数えるものを言語ごとに直し、
       名前で引くようにしたので、二重の行では緑になりません。 */
    n = 0; b = 0;
    for (j = 0; j < SLICES.length; j++){
      v = slRd(langKeyOf(ids[i], SLICES[j])) || '';
      if (v.length > 2){ n++; b += v.length; }
    }
    out.push({ id:ids[i], name:langNameOf(ids[i]), whose:langWhose(ids[i]),
               sid:String(ids[i]), slices:n, bytes:b });
  }
  return { before: before, after: ids.length, langs: out };
}, { srv: SERVER, saved: up.srv });

const names = came.langs.map(l => l.name).sort().join(',');
say(names.indexOf('Vaska') >= 0 && names.indexOf('Toko') >= 0,
    'on a phone with an empty storage, signing in brings both back by name: ' +
    (names || 'nothing'));
const cameBy = {};
came.langs.forEach(l => { cameBy[l.name] = Math.max(cameBy[l.name] || 0, l.slices); });
say(cameBy['Vaska'] >= 1 && cameBy['Toko'] >= 1,
    'and with what was in them, not just their names — asked of each language ' +
    'by name, over every slice: ' +
    JSON.stringify(came.langs.map(l => l.name + ' ' + l.slices + ' slices ' + l.bytes + 'B')));
say(came.langs.every(l => l.whose === 'mine'),
    'and both are the person’s own: ' +
    JSON.stringify(came.langs.map(l => l.name + ' ' + l.whose)));

/* ---- 2b. AND ONE ROW PER LANGUAGE, NOT TWO ------------------------------
   「起動で同じ言語が切り替えに 2 行並ぶ。ならばないようにして」 OWNER 2026-09-09.

   `netTook()` fired TWO roads that each bring this account's languages down
   and each MAKE the index row: `netLangBack()` straight from it, and
   `netLangsDown()` through `pullBoot()`. They raced. `netLangBack1()` asked
   the slices FIRST and made its entry in the answer, keyed by the `sid`;
   `netLangsWalk()` made its entry FIRST, keyed by a fresh `langMint()` id --
   so by the time netLangBack1()'s answer came back, `LANGS[sid]` was still
   undefined and it made a SECOND entry for a language that was already there.

   Nothing throws and nothing is lost. It is found by somebody opening the
   switcher and seeing their language twice (docs/BACKLOG.md 2026-09-09).

   ASKED OF THE SID AND NOT OF THE NAME. Two entries for one language carry
   one `sid` between them, and that is the whole of the claim -- a count of
   rows would also be moved by a language legitimately arriving, and a count
   of NAMES would be green for two rows whose name column had not come down
   yet. */
const bySid = {};
came.langs.forEach(l => { if (l.sid) bySid[l.sid] = (bySid[l.sid] || 0) + 1; });
const twice = Object.keys(bySid).filter(k => bySid[k] > 1);
say(twice.length === 0,
    'and the launch made ONE row per language — the two roads that each ' +
    'brought this account’s languages down are one road now: ' +
    JSON.stringify(came.langs.map(l => l.name + ' [' + l.sid + ']')));

/* ---- 3. it FILLS IN, and never wins ------------------------------------- */
const holds = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  /* this phone has a language already, and its words differ from the server's */
  /* A language the SERVER also has, and not the empty one this phone minted
     for itself at load -- the restore has nothing to write over that one, so
     pointing the claim at it makes the claim green whatever the code does.
     That is exactly what it was, until the diagnostics were printed. */
  var ids = Object.keys(LANGS), one = '', z0;
  for (z0 = 0; z0 < S.lang.length; z0++) if (LANGS[S.lang[z0].id]) one = S.lang[z0].id;
  /* This phone's copy of a language the SERVER also has, and it says something
     different. A restore that wins writes the server's over it; a restore that
     fills in leaves it. */
  slWr(langKeyOf(one, 'words'),
    JSON.stringify([{ hw:'ONPHONE', ph:['o'], mn:'here', mns:['here'], pos:'n', at:9 }]));
  var was = slRd(langKeyOf(one, 'words'));
  /* netLangBack() runs once per account per launch, so a second netTook()
     with the same uid returns at the door. Cleared here, or the two claims
     below are green because nothing ran -- which is what they were the first
     time this was written. */
  NET_BACK = '';
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  var now = slRd(langKeyOf(one, 'words'));
  /* and a server that does not answer at all */
  S.down = true;
  NET_BACK = '';
  var langsWas = JSON.stringify(LANGS);
  var slicesWas = ids.map(function(i2){ return slRd(langKeyOf(i2, 'words')); }).join('|');
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
  await wait(400);
  S.down = false;
  return {
    srvWords: (function(){ var q, w=''; for(q=0;q<S.slice.length;q++)
        if(S.slice[q].language===one && S.slice[q].kind==='words') w=S.slice[q].body;
        return String(w).slice(0,40); })(),
    langsNow: Object.keys(LANGS).join(','),
    one: one,
    kept: (now || '').indexOf('ONPHONE') >= 0,
    keptWhat: String(now || '').slice(0, 60),
    ran: NET_BACK,
    downLangs: JSON.stringify(LANGS) === langsWas,
    downSlices: ids.map(function(i2){ return slRd(langKeyOf(i2, 'words')); }).join('|') === slicesWas
  };
}, { srv: SERVER, saved: up.srv });

say(holds.kept,
    'what is already on the phone is not written over by what is on the server — ' +
    'a restore fills in what is missing and stops (docs/DATA_SAFETY.md): the ' +
    'phone still says `' + holds.keptWhat + '`');
say(holds.downLangs && holds.downSlices,
    'and a server that does not answer changes nothing at all — 「the plan is ' +
    'unknown」 and 「this person has no data」 are not the same state');

/* ---- 4. AND NOTHING EVER SHRINKS -----------------------------------------
   The condition this whole piece of work is written under: 「この変更で
   localStorage からキーを一本も消さないこと」. The three ways a server says
   nothing are three different states and none of them is 「this person has no
   languages」 -- an empty array, a 500, and a connection that dies. All three
   have to leave the phone exactly as it was.

   Measured as bytes AND as a count of keys, because "the language is still in
   the index" is also true of one whose slices have been emptied. */
const safe = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved), out = {};
  S.lang = keep.lang; S.slice = keep.slice;
  /* WHAT IS MEASURED IS WHAT SOMEBODY MADE, AND THE PICTURE IS NOT THAT.
     `lingua.<id>.<slice>.got` is what the SERVER last said (www/core.js §
     slGot) -- it is written by netAgreed() every time the two sides agree, so
     it changes size whenever the app speaks to the server at all, and a
     shrink there means the server's answer got shorter, not that anybody lost
     anything. Measured 2026-09-09: this fired on a picture catching up with a
     word the phone was already holding, with `slMine()` byte for byte the
     same on both sides of it.

     So the picture is watched for GOING (a key that disappeared is still a
     loss) and not for shrinking, and what is watched for shrinking is the
     rest -- the index, the session, the settings, the posts, and every body
     the phone itself is holding, which is `slMine()` and is in MEMORY rather
     than on the disk (rule 22). Without that last part this would be
     measuring less than it did before, not more. */
  function snap(){
    var m = {}, i, k, id, j;
    for (i = 0; i < localStorage.length; i++){
      k = localStorage.key(i);
      m[k] = String(localStorage.getItem(k) || '').length;
    }
    for (id in LANGS){
      if (!Object.prototype.hasOwnProperty.call(LANGS, id)) continue;
      for (j = 0; j < SLICES.length; j++){
        var v = slMine(langKeyOf(id, SLICES[j]));
        if (v !== null) m['HOLDS ' + id + '.' + SLICES[j]] = String(v).length;
      }
    }
    return m;
  }
  function lost(was, now){
    var k, gone = [];
    for (k in was){
      if (!Object.prototype.hasOwnProperty.call(was, k)) continue;
      if (!(k in now)) { gone.push(k + ' GONE'); continue; }
      if (k.indexOf('.got') === k.length - 4) continue;
      if (now[k] < was[k]) gone.push(k + ' ' + was[k] + '→' + now[k]);
    }
    return gone;
  }
  async function against(how){
    var was = snap(), keys = Object.keys(was).length;
    NET_BACK = '';
    if (how === 'empty'){ S.lang = []; S.slice = []; }
    if (how === 'down'){ S.down = true; }
    netTook({ access_token:'t', refresh_token:'r', user:{ id:'me' } });
    await new Promise(function(f){ netLangSync(function(){ f(); }); });
    await wait(300);
    S.down = false; S.lang = keep.lang; S.slice = keep.slice;
    var now = snap();
    return { lost: lost(was, now), keys: keys, keysNow: Object.keys(now).length };
  }
  out.empty = await against('empty');
  out.down  = await against('down');

  /* and twice over, which is the other way a merge goes wrong */
  var one = '', z;
  for (z = 0; z < S.lang.length; z++) if (LANGS[S.lang[z].id]) one = S.lang[z].id;
  function words(){
    try { return (JSON.parse(slRd(langKeyOf(one, 'words')) || '[]') || []).length; }
    catch (e) { return -1; }
  }
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(200);
  var n1 = words();
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(200);
  out.twice = [n1, words()];
  /* and a slice that came back SMALLER is refused rather than written. Driven
     by handing the merge a shorter body than the phone has -- the one shape
     the condition names, made to happen rather than reasoned about. */
  var big = JSON.stringify([{hw:'a'},{hw:'b'},{hw:'c'},{hw:'d'}]);
  slWr(langKeyOf(one, 'words'), big);
  var oldMerge = syMerge;
  syMerge = function(){ return JSON.stringify([{hw:'a'}]); };
  NET_SHRANK = [];
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(200);
  syMerge = oldMerge;
  out.shrankKept = slRd(langKeyOf(one, 'words')) === big;
  out.shrankSaid = NET_SHRANK.length > 0;
  return out;
}, { srv: SERVER, saved: up.srv });

say(safe.empty.lost.length === 0 && safe.empty.keysNow >= safe.empty.keys,
    'a server that answers with an EMPTY LIST takes nothing away — an empty ' +
    'answer is not 「this person has no languages」: ' + safe.empty.keys + ' keys ' +
    'before, ' + safe.empty.keysNow + ' after' +
    (safe.empty.lost.length ? ', LOST ' + safe.empty.lost.join(', ') : ''));
say(safe.down.lost.length === 0 && safe.down.keysNow >= safe.down.keys,
    'and a server that does not answer at all takes nothing away: ' +
    safe.down.keys + ' keys before, ' + safe.down.keysNow + ' after' +
    (safe.down.lost.length ? ', LOST ' + safe.down.lost.join(', ') : ''));
say(safe.twice[0] === safe.twice[1] && safe.twice[0] > 0,
    'and syncing twice in a row does not grow the dictionary — syMerge adds ' +
    'both sides, so a language that gains a word every launch is the other way ' +
    'this goes wrong: ' + safe.twice.join(' then '));

say(safe.shrankKept && safe.shrankSaid,
    'and a merge that comes back SMALLER than what is on the phone is skipped ' +
    'and said out loud, never written — 「同じキーを、今より少ない中身で書かない」: ' +
    (safe.shrankKept ? 'the phone kept its four words' : 'THE PHONE LOST WORDS') +
    ', ' + (safe.shrankSaid ? 'and it was recorded' : 'and nothing said so'));

/* ---- waiting is not empty, and a refusal is not an answer ----------------
   Two sentences the timeline used to say before the server had said anything.

   「snsで一瞬何も出ないとかあり得んやろ」「後お題も出てこない1秒待つけど」
   OWNER 2026-09-02. A phone with no local copy drew 「まだ何も無い」 while the
   first answer was still out -- a statement about the SERVER made before it
   answered -- and the day's sentence asked once, so a first ask that failed
   was the last one for that session.

   Nothing here is stubbed but the two answers themselves: what is under test
   is what the screen says while it has none, and what happens after a
   refusal. */
const W = await pg.evaluate(async () => {
  function wait(ms){ return new Promise(function (r){ setTimeout(r, ms); }); }
  const out = {};
  /* Past the door, or render() draws the onboarding and never reaches the
     timeline at all -- which is what this measured the first time.

     AND THE ACCOUNT HAS A NAME. appIs() answers 'door' for a session whose
     account has never been named (www/shell.js, 2026-09-03) -- that is the
     last step of the door and it is why a new Google account can no longer
     walk straight into the app. A phone with a timeline on it is past that,
     so this one is too. */
  SET.walked = true;
  ME.name = 'Aya'; ME.handle = 'aya'; saveMe();
  /* 「NOBODY HAS ASKED YET」 IS THE WHOLE TABLE AND NOT ONE FLAG. It was
     `SNS_GOT = {}` alone, and that stopped being the whole of it on
     2026-09-11, when the table gained 「訊けなかった」 (www/sns.js § pullSay):
     every request this page has made has fallen -- there is no server behind
     `file://` -- so the feed was quite correctly saying ［接続できません］ and
     this claim read it as 「said empty」. pullForget() is the app's own one
     place for 「this phone has been told nothing」 and it is what is meant. */
  POSTS = []; SNS_GOT = {}; snsTab = 'fo'; pullForget();
  window.route = 'feed'; NAV = [{ r:'feed' }]; render();
  out.markTurns = !!document.querySelector('#app .snswait .pullrule');
  out.saidNoneWaiting = document.querySelector('#app .empty .eb') !== null;
  /* An answer that came back EMPTY is still an answer, and now it may say so. */
  SNS_GOT['fo'] = 1; render();
  out.saysNoneAfter = document.querySelector('#app .empty .eb') !== null;
  out.markGone = !document.querySelector('#app .snswait');
  /* ---- AND THE THIRD FACE: 訊けなかった ---------------------------------
     「全部サーバーでやってる。電波なしならクルクル回るやろ」 OWNER 2026-09-11.
     An answer of 0 from ten minutes ago is not a statement about a server this
     phone cannot reach now, so 「まだ何もない」 may not stand after a fall.
     It is the sentence netPop() already puts up, drawn in the body. */
  PULL_OFF['feed'] = 1; render();
  out.offSaysOffline = ((document.querySelector('#app .empty .eb') || {}).textContent
                          === t('net.offline'));
  out.offMarkGone = !document.querySelector('#app .snswait');
  /* And an answer coming back is the end of it, without anybody clearing a
     second flag by hand. */
  PULL_OFF['feed'] = 0; render();
  out.backToNone = ((document.querySelector('#app .empty .eb') || {}).textContent
                      === t('sns.none.fo'));
  /* ---- AND THE DAY'S SENTENCE, WHICH IS THREE FACES AND ONE ROAD ---------
     「お題も1秒遅れ表示」 OWNER 2026-09-05.

     It had a back-off of its own -- a second, then two, then four -- and this
     file used to count the tries. That is gone: a refusal reaches netPop()
     through pullRun() like every other ask, and ［再接続］ is what asks again.
     So what is measured here is the road, not a private timer.

     And the row itself, which is where the owner was looking. Before the
     answer it is the MARK; after an answer that carries no sentence it is the
     plain composer row it has always been; both are pressable, because a row
     that cannot be pressed while the app finds something out has taken the
     way to post away. */
  let asks = 0;
  let fall = true;
  window.netDay = function (ok, bad){
    asks++;
    if (fall) { bad(null, 0, 'day 0'); return; }
    ok({ id:'p1', on_day:'2026-09-02', text:'the sea', says:{ en:'the sea' } });
  };
  DAY = null; DAY_GOT = false; PULL_GOT.day = 0; PULL_OUT.day = 0;
  /* Not asked yet: the mark stands where the sentence goes, and the row is
     still a button. */
  render();
  out.dayMark = !!document.querySelector('#app .wrow .numwait');
  out.dayRowPressable = !!document.querySelector('#app button.wrow');
  out.daySaidPlaceholder = (document.querySelector('#app .wrow .wrt') || {}).textContent
                             === t('post.ln.ph');
  pullGo('day');
  await wait(60);
  out.popOnFall = popOn();
  out.asksBeforeAgain = asks;
  /* ［再接続］, which is the one road a fallen request comes back down. The
     COUNT is not what is measured -- a render asks too, and how many renders
     happen between here and there is not this file's business. What is
     measured is that the fall raised the pop and that pressing 再接続 is what
     got the sentence. */
  fall = false;
  netPopAgain();
  await wait(200);
  out.asks = asks;
  out.gotDay = !!(DAY && DAY.text);
  /* And a day the writer missed: an answer, with no sentence in it. */
  DAY = null; DAY_GOT = true;
  render();
  out.plainAfterNone = !document.querySelector('#app .wrow .numwait') &&
    (document.querySelector('#app .wrow .wrt') || {}).textContent === t('post.ln.ph');
  return out;
});
say(W.markTurns && !W.saidNoneWaiting,
    'a timeline with no answer yet turns the app own mark and claims nothing ' +
    'about what is on the server (' + (W.markTurns ? 'mark' : 'NO MARK') + ', ' +
    (W.saidNoneWaiting ? 'AND SAID EMPTY' : 'said nothing') + ')');
say(W.saysNoneAfter && W.markGone,
    'and an answer that came back empty is when it says so, with the mark gone');
say(W.dayMark && !W.daySaidPlaceholder && W.dayRowPressable,
    'the day row turns the mark before the server has answered, rather than ' +
    'standing as the plain composer and swapping a second later -- and it is ' +
    'still a button (' + (W.dayMark ? 'mark' : 'NO MARK') + ', ' +
    (W.daySaidPlaceholder ? 'AND DREW THE PLAIN ROW' : 'drew no stand-in') + ', ' +
    (W.dayRowPressable ? 'pressable' : 'NOT PRESSABLE') + ')');
say(W.popOnFall && W.asks > W.asksBeforeAgain && W.gotDay,
    'a refusal puts the one pop up rather than retrying on a timer of its own, ' +
    'and 再接続 is what asks again (' + (W.popOnFall ? 'pop' : 'NO POP') + ', ' +
    W.asksBeforeAgain + ' then ' + W.asks + ' asks, ' +
    (W.gotDay ? 'got it' : 'NEVER GOT IT') + ')');
say(W.offSaysOffline && W.offMarkGone,
    'そして訊けなかったときは「まだ何もない」ではなく［接続できません］── ' +
    'サーバーについて言えないことは言わない（' +
    (W.offSaysOffline ? '接続できません' : 'SAID SOMETHING ELSE') + '、' +
    (W.offMarkGone ? 'mark gone' : 'AND THE MARK KEPT TURNING') + '）');
say(W.backToNone,
    'そして答えが戻れば元の一文に戻る ── 旗を手で下ろす人は要らない');
say(W.plainAfterNone,
    'and a day the writer missed is the plain row again, not the mark left ' +
    'turning: an answer with no sentence in it is still an answer');

/* ---- and the three screens beside the timeline -------------------------
   「なんか全体的に前のが残ってたりするからちゃんとローディングさせられないの？」
   OWNER 2026-09-03.

   The timeline was made honest above and the screens either side of it were
   not: each of them drew NOTHING AT ALL where the answer was still out, and
   nothing at all is what those same screens draw when the answer came back
   with none in it. So 「空」 and 「まだ来ていない」 shared a branch on three
   more screens -- CLAUDE.md § Data, the same sentence the timeline needed.

   A phone that has never held this account's lists is in the second state
   EVERY time it signs in, which is why it is the state a new phone always
   sees and the one nothing was measuring.

   `netSend` is not stubbed here: what is under test is what the screen says
   while it has no answer, so the answer is simply withheld. What the screens
   read is `snsHits` and the pull table's own record of what has been answered
   (`PULL_GOT`, www/sns.js § pullRun) -- the two flags these screens used to
   keep for themselves are gone, and one table holds it for all of them now.
   Setting the record by hand is the answer landing. Nothing else is
   replaced. */
const V = await pg.evaluate(() => {
  const out = {};
  function markOn(){ return !!document.querySelector('#app .snswait .pullrule'); }
  function noteOn(){ return !!document.querySelector('#app .note'); }
  SET.walked = true;
  ME.name = 'Aya'; ME.handle = 'aya'; saveMe();

  /* THE SEARCH, with a word typed and the answer still out. */
  window.route = 'explore'; NAV = [{ r:'explore' }];
  snsQ = 'sea'; snsHits = null; render();
  out.findTurns = markOn();
  out.findSaidNone = noteOn();
  /* And the answer, come back with nobody and nothing in it. */
  snsHits = { q:'sea', who:[], posts:[] }; render();
  out.findSaysNone = noteOn();
  out.findMarkGone = !markOn();

  /* THE WORDS THIS ACCOUNT HAS TYPED, under an empty field. */
  /* pullDrop() rather than `PULL_GOT.x = 0`: 「forget what was answered」 is
     one act and the table answers it in one place -- since 2026-09-11 that
     record has three values, not two, and a route whose last ask FELL is not
     a route nobody has asked (www/sns.js § pullSay). Every request on this
     page has fallen. */
  snsQ = ''; snsHits = null; SET.recent = []; pullDrop('recent'); render();
  out.recentTurns = markOn();
  PULL_GOT.recent = 1; render();
  out.recentMarkGone = !markOn();
  /* And the third face, on this screen too. */
  pullDrop('recent'); PULL_OFF.recent = 1; render();
  out.recentOffline = !!document.querySelector('#app .empty .eb');

  /* THE WORDS IT HAS KEPT, on the screen that lists them. */
  window.route = 'filter'; NAV = [{ r:'filter' }];
  SET.saved = []; pullDrop('saved'); render();
  out.savedTurns = markOn();
  PULL_GOT.saved = 1; render();
  out.savedMarkGone = !markOn();
  pullDrop('saved'); PULL_OFF.saved = 1; render();
  out.savedOffline = !!document.querySelector('#app .empty .eb');
  return out;
});
say(V.findTurns && !V.findSaidNone,
    'a search with its answer still out turns the mark and does not say ' +
    'nothing was found (' + (V.findTurns ? 'mark' : 'NO MARK') + ', ' +
    (V.findSaidNone ? 'AND SAID NOTHING FOUND' : 'said nothing') + ')');
say(V.findSaysNone && V.findMarkGone,
    'and an answer that really came back empty is when it says so, mark gone');
say(V.recentTurns && V.recentMarkGone,
    'the words this account has typed turn the mark until the list has come ' +
    'back, and stop when it has (' + (V.recentTurns ? 'mark' : 'NO MARK') + ', ' +
    (V.recentMarkGone ? 'then gone' : 'AND KEPT TURNING') + ')');
say(V.savedTurns && V.savedMarkGone,
    'and so do the words it has kept (' + (V.savedTurns ? 'mark' : 'NO MARK') +
    ', ' + (V.savedMarkGone ? 'then gone' : 'AND KEPT TURNING') + ')');
say(V.recentOffline && V.savedOffline,
    'そしてその二つも、訊けなかったときは黙らず［接続できません］と言う ── ' +
    '一箇所（snsEmpty）に乗っているので、面が三つに増えても書き足す所は無い');

/* ---- a word somebody deleted stays deleted -------------------------------
   docs/RISK.md item 4. This file already holds the other direction -- that
   syncing twice does not GROW the dictionary, and that a merge coming back
   smaller is refused -- and neither of those is this one. Nothing anywhere
   asked whether something the person removed is still removed afterwards.

   Measured before it was written: delete a word, sync once, and the word is
   back at the END of the list and has been written UP to the server as well,
   so the phone has now taught the server its own mistake.

   「消すも保存もそうだけど、そういったものが動く時はサーバーに行かないと。
   オフラインで作業できるのはオンラインに復帰した時にそれが最新データになる
   んだから」 OWNER 2026-09-04. */
/* THE PAGE IS RELOADED FIRST, and that is not tidiness. The scenario above
   replaces `syMerge` itself with a stub -- `function(){ return [{hw:'a'}] }`,
   to prove that a merge coming back smaller is refused -- and never puts the
   real one back. Every scenario after it therefore runs against that stub, in
   one page, in silence. Written without this reload, the claims below went red
   for the wrong reason and looked exactly like the bug they were written for.
   A fresh page is the only thing that gives them the real sync.js back. */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const del = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  for (var i in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, i)) langOwnGot(i, SESS.uid);
  langStore();
  /* On the disk before anything is sent. The seed fills the globals; a slice
     is what localStorage holds, and the sync reads it from there. */
  save(); saveLetters();

  /* 1. the dictionary goes up, so the server is holding it */
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(150);
  var S = window.__SRV, sid = langId;
  function onServer(){
    var r = S.slice.filter(function(x){ return x.language === sid && x.kind === 'words'; })[0];
    try { return r ? JSON.parse(r.body).map(function(w){ return String(w.hw); }) : []; }
    catch (e) { return []; }
  }
  var hw = function(){ return WORDS.map(function(w){ return String(w.hw); }); };
  var out = { server0: onServer() };

  /* 2. somebody deletes one, the way the button does */
  out.gone = hw()[0];
  wDrop(out.gone); save();
  out.storedAfterDelete = JSON.parse(slRd(langKey('words')) || '[]')
    .map(function(w){ return String(w.hw); });
  out.afterDelete = hw();

  /* 3. and the app speaks to the server again */
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(180);
  out.afterSync = hw();
  out.server1 = onServer();

  /* 4. and once more -- "it comes back on the launch after" is the shape */
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(180);
  out.afterTwice = hw();
  out.server2 = onServer();
  return out;
}, { s: seed.toString(), srv: SERVER });

say(del.server0.indexOf(del.gone) >= 0,
    'the word was on the server before it was deleted, so this is about a ' +
    'deletion and not about a word that never went up: ' + JSON.stringify(del.gone));
say(del.afterDelete.indexOf(del.gone) < 0,
    'deleting it takes it out of the dictionary on the phone');
say(del.storedAfterDelete.indexOf(del.gone) < 0,
    'and out of storage, so what follows is about the sync and not about a ' +
    'delete that never landed: ' + JSON.stringify(del.storedAfterDelete));
say(del.afterSync.indexOf(del.gone) < 0,
    'AND IT IS STILL GONE after the app has spoken to the server: ' +
    JSON.stringify(del.afterSync));
say(del.server1.indexOf(del.gone) < 0,
    'and the SERVER was told -- deleting is a thing that goes up, not a thing ' +
    'that happens only here: ' + JSON.stringify(del.server1));
say(del.afterTwice.indexOf(del.gone) < 0,
    'and it does not come back on the launch after that one either');
say(del.afterSync.length === del.afterDelete.length,
    'and nothing else moved: ' + del.afterDelete.length + ' words before the ' +
    'sync, ' + del.afterSync.length + ' after');

/* ---- 保存を押した瞬間にサーバーへ行く ------------------------------------
   「オンラインは一本化ね？」「簡単よ」「保存としたらオンラインおしまい」
   OWNER 2026-09-04。

   **起動と扉の二回しか無かった。**`netLangSync()` を呼ぶのは `www/boot.js` と
   `www/onboard.js` だけで、その間にサーバーへ行く道は一本も無かった（数えて
   確認）。一時間書いて閉じた人の作ったものは、次に開くまでこの iPhone の中に
   しかない。

   ここが訊くのは四つ。**起動を一度も挟まずに**、押した保存が届くこと。
   動いた欄だけを訊いて、動いた欄だけを送ること ── 全部訊くと大きい言語で
   毎回 685 KB になる。動いていなければ何も送らないこと。そして署名が
   無ければ何も送らず、何も失わないこと。

   `netSend` の下の偽サーバーは上のものをそのまま使う。`netSaveUp` も
   `netSlices` も本物が走る。 */
const up2 = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me2', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  const out = {};
  /* 待つのは NET_UPMS ＋ 往復のぶん。数はコードから読む ── ここに書くと
     片方だけ動いたときに黙って通る。 */
  const settle = () => wait(NET_UPMS + 400);

  var id = langId;
  LANGS[id].mine = true; langOwnGot(id, 'me2'); langStore();
  langName = 'Save Now'; save();

  /* まず一度合わせて、両者が同じものを持っている所から始める。ここから先の
     送信だけを見たいので、記録を空にする。 */
  await new Promise(function(f){ netLangSync(f); });
  window.__SRV.sent = [];
  window.__SRV.asked = [];
  /* GET が何を訊いたかを見る。上の stub は kind の絞りを読まないので、
     絞れているかは「訊いた道」で見るしかない。 */
  var realSend = netSend;
  netSend = function(m, p, b, tk, ok, bd){
    if (m === 'GET' && p.indexOf('/rest/v1/slice') === 0) window.__SRV.asked.push(p);
    return realSend(m, p, b, tk, ok, bd);
  };

  /* 一. 単語を一つ足して保存する。起動はしない。扉も通らない。 */
  WORDS.push({ hw:'nyala', gl:'a word added after the launch' });
  save();
  out.sentAtOnce = window.__SRV.sent.slice();   /* 押した直後 ── まだ空のはず */
  await settle();
  out.sentAfter = window.__SRV.sent.slice();
  out.asked = window.__SRV.asked.slice();
  out.onServer = (function(){
    var S = window.__SRV, sid = id, i;
    for (i = 0; i < S.slice.length; i++)
      if (S.slice[i].language === sid && S.slice[i].kind === 'words')
        return S.slice[i].body.indexOf('nyala') >= 0;
    return false;
  })();

  /* 二. 何も動かしていない保存は、何も送らない。 */
  window.__SRV.sent = [];
  save();
  await settle();
  out.sentIdle = window.__SRV.sent.slice();

  /* 三. 一続きに打っても、送るのは一度。十回保存して一回。 */
  window.__SRV.sent = [];
  for (var n = 0; n < 10; n++){ WORDS.push({ hw:'burst' + n, gl:'x' }); save(); }
  await settle();
  out.sentBurst = window.__SRV.sent.slice();

  /* 五. 二台目が同じ言語を書いていたら、中身を読みに行く。
     ここを間違えると片方の単語が黙って消えます ── 保存が中身を読まなくなった
     のは「印が動いていなければサーバーは合意した中身を持っている」からで、
     動いていれば読まなければなりません。相手の行を直に書き換えて、印を
     別の文字列にします（二台が同時に書けば印は必ず別の文字列です）。 */
  window.__SRV.sent = [];
  window.__SRV.asked = [];
  (function(){
    var S = window.__SRV, sid = id, i, o;
    for (i = 0; i < S.slice.length; i++)
      if (S.slice[i].language === sid && S.slice[i].kind === 'words'){
        o = JSON.parse(S.slice[i].body);
        o.push({ hw:'mikka', gl:'a word the SECOND phone added' });
        S.slice[i].body = JSON.stringify(o);
        S.slice[i].at = '2099-01-01T00:00:00.000Z';
      }
  })();
  WORDS.push({ hw:'yonka', gl:'a word THIS phone added' });
  save();
  await settle();
  out.askedTwo = window.__SRV.asked.slice();
  out.bothOnServer = (function(){
    var S = window.__SRV, sid = id, i, b;
    for (i = 0; i < S.slice.length; i++)
      if (S.slice[i].language === sid && S.slice[i].kind === 'words'){
        b = S.slice[i].body;
        return b.indexOf('mikka') >= 0 && b.indexOf('yonka') >= 0;
      }
    return false;
  })();

  /* 六. 合意の控えを無くした端末は、中身を読みに行く。
     「控えが無い」は「サーバーは空」ではありません ── `langWasKey` はこの
     端末とサーバーが最後に同じ文字列を持った時の**控え**で、それが無いのは
     「知らない」です。netGotFor() はそこを `''` にしていました。`''` は
     syMerge() が「サーバーは何も持っていない」と読む値なので、片側が空の
     まま突き合わせに入ります ── この端末が何も持っていない欄なら、結果は
     「両方とも空」で、サーバーが持っている中身は読まれも降りもしません。
     CLAUDE.md 規則 11「『空』と『壊れている』は違う状態」と同じ一文です。

     印（NET_AT）は残し、控えだけを落とします。この二つは netAgreed() が
     一緒に書くので普段は揃っていますが、揃っていることに寄りかかった枝が
     あるかどうかが、ここで訊いていることです。 */
  window.__SRV.sent = [];
  window.__SRV.asked = [];
  /* 五の突き合わせで store は増えましたが、WORDS は増えていません ── 保存の
     道は merge のあと langLoad() を呼ばないからです（起動の道は呼びます）。
     ここが訊いているのは控えの話なので、その一つを持ち込まないように読み
     直します。**保存が merge のあと globals を読み直さないこと自体は別の
     欠陥で、docs/BACKLOG.md にあります。** */
  langLoad();
  slRm(langWasKey(id, 'words'));
  out.markKept = netAtHas(id, 'words');
  out.wasGone = slMine(langWasKey(id, 'words')) === null;
  WORDS.push({ hw:'gonka', gl:'a word added after the record was lost' });
  save();
  await settle();
  out.askedNoWas = window.__SRV.asked.slice();
  out.keptAllThree = (function(){
    var S = window.__SRV, sid = id, i, b;
    for (i = 0; i < S.slice.length; i++)
      if (S.slice[i].language === sid && S.slice[i].kind === 'words'){
        b = S.slice[i].body;
        return b.indexOf('mikka') >= 0 && b.indexOf('yonka') >= 0 && b.indexOf('gonka') >= 0;
      }
    return false;
  })();

  /* 四. 署名が無ければ何も送らない。そして何も失わない ── 言語はこの iPhone に
     そのまま在る。「電波が無いときはログインできない」はオーナーの決定だが、
     それは画面の話で、書いたものが消えてよいという意味ではない。 */
  window.__SRV.sent = [];
  var keep = SESS; SESS = null;
  WORDS.push({ hw:'offline', gl:'written with nobody signed in' });
  save();
  await settle();
  out.sentOut = window.__SRV.sent.slice();
  out.keptOut = (slRd(langKeyOf(id, 'words')) || '').indexOf('offline') >= 0;
  SESS = keep;
  netSend = realSend;
  return out;
}, { s: seed.toString(), srv: SERVER });

say(up2.sentAtOnce.length === 0 && up2.sentAfter.length > 0,
    '保存を押したらサーバーへ行く ── 起動も扉も通らずに（押した直後 ' +
    up2.sentAtOnce.length + ' 件、落ち着いてから ' + up2.sentAfter.length + ' 件）');
say(up2.onServer,
    'そして足した単語がサーバーの行に入っている');
say(up2.sentAfter.length === 1 && up2.sentAfter[0].indexOf(':words') > 0,
    '送るのは動いた欄だけ ── 十二本ではなく一本: ' + JSON.stringify(up2.sentAfter));
say(up2.asked.length === 1 && up2.asked[0].indexOf('kind=in.(words)') > 0 &&
    up2.asked[0].indexOf('select=kind,no,at') > 0,
    'そして訊くのは動いた欄の**印だけ** ── 中身は訊かない。全部降ろすと ' +
    '大きい言語で毎回 685 KB、動いた欄の中身でも 877 KB ' +
    '（docs/reports/cost-2026-09-09.md 一）: ' + JSON.stringify(up2.asked));
say(up2.askedTwo.length === 2 &&
    up2.askedTwo[0].indexOf('select=kind,no,at') > 0 &&
    up2.askedTwo[1].indexOf('body') > 0,
    'でも二台目が書いていたら中身を読みに行く ── 印が動いていれば読む: ' +
    JSON.stringify(up2.askedTwo));
say(up2.bothOnServer,
    'そして二台の単語が両方サーバーに残る ── 片方が消えない' +
    (up2.bothOnServer ? '' : '**片方が消えた**'));
say(up2.markKept && up2.wasGone && up2.askedNoWas.length === 2 &&
    up2.askedNoWas[0].indexOf('select=kind,no,at') > 0 &&
    up2.askedNoWas[1].indexOf('body') > 0,
    '控えを無くした端末も中身を読みに行く ── 「控えが無い」は「サーバーは空」' +
    'ではない（印 ' + (up2.markKept ? 'あり' : '**無し**') + '、控え ' +
    (up2.wasGone ? '無し' : '**あり**') + '、訊いた道 ' +
    JSON.stringify(up2.askedNoWas) + '）');
say(up2.keptAllThree,
    'そして三つの単語がすべてサーバーに残る ── 二台目のも、この端末のも、' +
    '控えを無くしたあとのも' + (up2.keptAllThree ? '' : '**消えた**'));
say(up2.sentIdle.length === 0,
    '何も動いていない保存は、何も送らない: ' + JSON.stringify(up2.sentIdle));
say(up2.sentBurst.length === 1,
    '続けて十回保存しても送るのは一度 ── 一続きは一回（' +
    up2.sentBurst.length + ' 件）');
say(up2.sentOut.length === 0 && up2.keptOut,
    '署名が無ければ何も送らず、書いたものはこの iPhone に残る（送信 ' +
    up2.sentOut.length + ' 件、' + (up2.keptOut ? '残っている' : '**消えた**') + '）');

/* ---- 保存を押して通信が落ちたら、何も進まない ------------------------------
   「後通信なくても文字書いて保存できたけど、これって消えない？
     普通ボタン押したら通信できませんになるはずだよね？」 OWNER 2026-09-05
   「通信エラーなら進むわけねえだろ全部」 OWNER 2026-09-05。

   **上の四つは「届く」だけを訊いていて、届かなかったときを訊いていなかった。**
   それが 2026-09-05 に実機で出た形です ── 電波の無いところで文字を書いて保存を
   押すと、画面はレターの一覧へ進み、「保存しました」と出て、要求はその 1.2 秒
   後にはじめて出て行きました。保存は netSaveUp() の溜め（NET_UPMS）で、押した
   ボタンはその結果を一度も訊いていませんでした。

   **ここは押します。**関数を呼ぶのではなく、画面に立って、バーの保存を
   クリックします ── 訊いているのは「ボタンが何をするか」で、関数が何をするか
   ではないからです。関数を呼ぶ検査は、ボタンがその関数に繋がっていない日に
   緑のままになります。

   落ち方は二つあり、**二つ目が黙っていたほうです**:

     S.down       通信ごと落ちる。GET も POST も返らない
     S.downSlice  言語の欄は分かっていて、**その人の作ったものを運ぶ POST だけ**
                  が落ちる。netSlice1() の netSlicePut 失敗が done() を呼んで
                  いたので、五本落ちてもポップは一つも立ちませんでした

   そして三つ目に、**電波があるときは今までどおり進む**ことを訊きます。落ちた
   ときに止める直しは、止まったままにする直しと一行しか違わないので。 */
async function pressSave(how){
  const set = await pg.evaluate(async ({ s, srv, how }) => {
    eval('(' + s + ')()');
    SET.walked = true;
    eval(srv);
    SESS = { at:'t', rt:'r', uid:'me3', anon:false };
    function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
    var id = langId;
    LANGS[id].mine = true; langOwnGot(id, 'me3');
    /* この言語はもうサーバーに欄がある ── 一度でも保存した iPhone がそうです。
       欄が無い状態だけを見ると、落ちるのは POST /language になり、その人の
       作ったものを運ぶ POST は一度も試されません。「行が在る」を言うのは
       `LROW`（www/core.js）── 番号が一本になる前は `sid` の欄でした。 */
    langRowGot(id); langStore();
    var l = LETTERS[0];
    /* **文字の編集に入る道は editLetter() で、go('glyph', id) ではありません。**
       GE を作るのは editLetter()/editGlyph() のほうで、go() だけで入ると
       vGlyph() の「冷えたまま歩く検査のための」逃げ道 newGE('a') が立ちます
       ── 'a' という id の文字はこの言語に無いので ltSetStrokes() は先頭の
       `if(!l) return null` で返り、書いた線はどこにも載りません。それで下の
       inkKept は fixture が l1 に最初から持たせている別の線を読んでいて、
       線を取り上げる実装に変えても緑のままでした。 */
    editLetter(l.id); render();
    await wait(200);
    /* 指が一本置いていったのと同じもの。**アプリ自身が作る形で書く** ──
       線の点は 0..800 の格子の [x,y] の並びで（GPLACE も保存された線もそう）、
       {x:0.2,y:0.8} のような形はアプリが一度も作らず、画面にも何も描かれま
       せん。そして l1 が最初から持っている三角とは別の形にする ── 同じ形だと
       「書いた線が載った」と「元から載っていた」が見分けられません。 */
    GE.st = [{ pts:[[112,688],[400,400],[688,688],[400,112],[112,400]] }];
    /* GE.st に載せればそれが「今この画面が持っているもの」です。画面は
       geNow() 一つで答え、KEEP はそれを開いた時と比べます
       （www/shell.js § keepOn、www/glyph.js § geNow）。buffer に押し込む
       geKeepPut() は無くなりました。 */
    render();
    await wait(50);
    window.__SRV.down = (how === 'down');
    window.__SRV.downSlice = (how === 'slice');
    window.__SRV.sent = []; window.__SRV.tried = [];
    return { drew: keepDirty(keepKey()), screen: JSON.stringify(NAV[NAV.length - 1]),
             /* 触っている文字と、そこに書いた線そのもの。長さではなく中身で
                見るので、元からある線と取り違えません。 */
             lid: GE.lid, ink: JSON.stringify(geInk(GE.st)),
             /* 押す前に文字が持っていた線。落ちたときはこれのままでなければ
                なりません ── 下の inkBack。 */
             was: JSON.stringify((ltById(GE.lid) || {}).st || []),
             hasBtn: !!document.querySelector('[data-do="keepPress"]') };
  }, { s: seed.toString(), srv: SERVER, how });
  if (!set.hasBtn) return Object.assign(set, { noButton:true });
  await pg.click('[data-do="keepPress"]');
  /* 溜めの時間より長く待つ。ここで通るなら、押した瞬間に出て行っています ──
     NET_UPMS をコードから読むので、溜めが変わってもこの検査は付いていきます。 */
  await pg.waitForTimeout(await pg.evaluate(() => NET_UPMS + 900));
  return await pg.evaluate(({ lid, ink, was }) => ({
    screen: JSON.stringify(NAV[NAV.length - 1]),
    pop: popOn(),
    toast: String((document.querySelector('.toast, #toast') || {}).textContent || ''),
    /* **落ちたら文字は元のまま。**
       「先にサーバーじゃないの？失敗しましたなのに端末に出るの変じゃない？」
       OWNER 2026-09-06。ここは 2026-09-05 の決定のもとでは逆を訊いていて
       ── 落ちた送信でも線は文字に載る ── その決定はこの日の一言で置き換わり
       ました。サーバーが受け取るまで端末の状態は動きません（keepSave() の
       keepBack、www/shell.js § KEEP）。
       **書いた線そのものと引き比べる。**「何か線が在る」では、この文字が最初
       から持っている線に当たって、どちらの実装でも緑になります。 */
    inkBack: JSON.stringify((ltById(lid) || {}).st || []) === was,
    /* そして描いたものは目の前から取り上げない ── GE はそのままで、buffer も
       持ったまま。もう一度押せばもう一度送られます。 */
    inkHeld: !!(typeof GE !== 'undefined' && GE) &&
             JSON.stringify(geInk(GE.st)) === ink && keepDirty(keepKey()),
    inkNow: JSON.stringify((ltById(lid) || {}).st || []),
    ink: ink, was: was,
    sent: window.__SRV.sent.slice(),
    tried: window.__SRV.tried.slice()
  }), { lid: set.lid, ink: set.ink, was: set.was });
}

const sv = { down: await pressSave('down'), slice: await pressSave('slice'),
             up: await pressSave('up') };

say(sv.down.screen.indexOf('glyph') >= 0 && sv.down.pop && !sv.down.toast,
    '**通信ごと落ちたら、保存は何も進めない** ── 画面はレターのまま、ポップが ' +
    '立ち、「保存しました」は出ない（画面 ' + sv.down.screen + '、ポップ ' +
    (sv.down.pop ? 'あり' : '**なし**') + '、文 ' +
    (sv.down.toast ? '**「' + sv.down.toast + '」**' : 'なし') + '）');
say(sv.slice.screen.indexOf('glyph') >= 0 && sv.slice.pop && !sv.slice.toast,
    '**その人の作ったものを運ぶ POST だけが落ちても、同じ** ── これが黙って ' +
    'いたほうで、五本落ちてポップが零だった（画面 ' + sv.slice.screen +
    '、ポップ ' + (sv.slice.pop ? 'あり' : '**なし**') + '、文 ' +
    (sv.slice.toast ? '**「' + sv.slice.toast + '」**' : 'なし') + '）');
say(sv.down.inkBack && sv.slice.inkBack,
    '**落ちたら文字は元のまま** ── 先にサーバー、届いてから端末（OWNER ' +
    '2026-09-06）（押す前 ' + sv.down.was + '。通信ごと ' +
    (sv.down.inkBack ? '元のまま' : '**' + sv.down.inkNow + '**') +
    '、POST だけ ' +
    (sv.slice.inkBack ? '元のまま' : '**' + sv.slice.inkNow + '**') + '）');
say(sv.down.inkHeld && sv.slice.inkHeld,
    'そして描いたものは目の前から取り上げない ── 画面の線はそのまま、もう一度 ' +
    '押せばもう一度送られる（書いた線 ' + sv.down.ink + '、通信ごと ' +
    (sv.down.inkHeld ? '在る' : '**消えた**') + '、POST だけ ' +
    (sv.slice.inkHeld ? '在る' : '**消えた**') + '）');
say(sv.down.tried.length > 0 && sv.slice.tried.length > 0,
    '押した瞬間に出て行く ── 溜め（NET_UPMS）を待たずに（通信ごと ' +
    sv.down.tried.length + ' 件、POST だけ ' + sv.slice.tried.length + ' 件）');
say(sv.up.screen.indexOf('glyph') < 0 && !sv.up.pop && !!sv.up.toast,
    'そして電波があれば今までどおり進む ── レターの一覧へ戻り、保存したと言う' +
    '（画面 ' + sv.up.screen + '、文 ' +
    (sv.up.toast ? '「' + sv.up.toast + '」' : '**なし**') + '）');

/* ---- 電波が無いとき、前に読み込んだ分が出る ------------------------------
   「Twitterとかは電波がないと開かないでしょ？」
   「前に読み込んだ分は出て欲しい。制作も眺めたい人はいるだろうし、」
   「スタンダードに合わせて作りたいから間違ってることあったら言って。」
   OWNER 2026-09-05。

   2026-09-04 にスライスを記憶へ移してから、**閉じたアプリは言語を一文字も
   持っていない。**電波が無ければ `netResume()` は返らず `netLangsDown()` も
   走らないので、開いた人は自分の言語が空になっているのを見る。

   訊くのは四つ。最初の一つは土台で、残りの三つのうち後ろ二つが「危ないほう」
   ── 写しが勝つこと、写しが出て行くことは、どちらも黙って起きる：

     一. サーバーから降りた分がディスクに写してある（土台）
     二. 電波を落としたまま閉じて開き直すと、前の言語が画面に出る
     三. 写しはサーバーの答えに一度も勝たない ── 答えが来たら上書きされる
     四. 写しはサーバーへ一度も出て行かない

   **電波が無いというのを本物でやる。**`netSend` は差し替えず、Supabase への
   要求そのものを `pg.route` で落とす。起動は本物の道を通って失敗する。 */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

/* 一段目 ── 署名して、言語をサーバーへ上げる。ここで写しが書かれる。
   名前と ID も書く： appIs() は名前の無いアカウントに扉を出すので、それが
   無いと二番目は「言語が出ない」ではなく「扉が出た」で赤くなる。 */
const seenUp = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.walked = true; setKeep();
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  ME.name = 'Aya'; ME.handle = 'aya'; saveMe();
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var id = langId;
  LANGS[id].mine = true; langOwnGot(id, 'me3'); langStore();
  langName = 'Kela';
  WORDS.push({ hw:'kelasu', gl:'a word that was on the screen before the signal went' });
  save();
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(200);
  netSave();
  var S = window.__SRV, got = 0, i, k;
  /* AND ONE OF SOMEBODY ELSE'S, TAKEN. 「前に読み込んだの出していいよ」 OWNER
     2026-09-12: the languages this account WROTE come back out of the `owner`
     picture, and the ones it TOOK answered 「まだ訊いていない」 on a launch
     with no signal and were not drawn at all. Seeded on the server and asked
     for through netTakes(), which is the real road -- it is what writes the
     answer down and what brings the row and its slices after it. */
  S.lang.push({ id:'theirs-9', owner:'other', name:'Somebody else',
                published_at:'2026-09-01T00:00:00Z' });
  S.slice.push({ language:'theirs-9', kind:'words', no:1, at:'2026-09-01T00:00:00Z',
                 body:JSON.stringify([{ hw:'zuri', gl:'a word of theirs' }]) });
  S.take.push({ uid:'me3', language:'theirs-9' });
  await new Promise(function(f){ netTakes(function(){ f(); }, function(){ f(); }); });
  await wait(300);
  langStore();
  for (i = 0; i < localStorage.length; i++){
    k = localStorage.key(i);
    if (k && k.indexOf('.got') === k.length - 4) got++;
  }
  /* The slices handed on are THIS language's. The taken one's words are on
     the server too now, and the stages below rebuild `S.slice` by walking it
     for 「the words slice」 -- with two of those, they would be measuring the
     wrong language's body. */
  return { id:id, gotKeys:got, took:langTook(), tookRow:!!LANGS['theirs-9'],
           pic:!!localStorage.getItem('lingua.take.me3'),
           srv:JSON.stringify({ lang:S.lang, take:S.take,
             slice:S.slice.filter(function(r){ return r.language === id; }) }) };
}, { s: seed.toString(), srv: SERVER });

say(seenUp.gotKeys > 0,
    'サーバーから降りた分がディスクに写してある ── これが無ければ下の三つは ' +
    '「まだ何も無い」を測っているだけになる（' + seenUp.gotKeys + ' 本）');
say(seenUp.took === 1 && seenUp.tookRow && seenUp.pic,
    'そして人の言語を一本取ってある ── `language_take` の答えが ' +
    seenUp.took + ' 本、その写しもディスクにある（土台）');

/* 二段目 ── アプリを閉じて、電波の無いところで開く。localStorage は消さない。
   それが「閉じた」であって「機種変」ではない（機種変は上の 2 番）。 */
await pg.route('https://*.supabase.co/**', r => r.abort());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const offline = await pg.evaluate(async () => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  await wait(400);
  window.route = 'words'; NAV = [{ r:'words' }]; render();
  var app = document.getElementById('app');
  var list = vLangs();
  return { words:WORDS.length, name:langName, signed:netSignedIn(),
           onScreen:(app ? app.textContent : '').indexOf('kelasu') >= 0,
           took:langTook(), whose:langWhose('theirs-9'),
           read:langWhose('theirs-9') === LW_READ,
           listed:list.indexOf('theirs-9') >= 0,
           dlCap:dlCap(), capHid:(function(){
             var m=list.match(/class="note">([^<]*)</g);
             return m? String(m[m.length-1]).replace(/^class="note">/, '').replace(/<$/, '') : ''; })() };
});

say(offline.words > 0 && offline.name === 'Kela',
    '**電波が無くても、前に読み込んだ言語が出る**（' + offline.words + ' 語、' +
    (offline.name || '名前なし') + '）');
say(offline.onScreen,
    'そして辞書の画面に本当に並んでいる ── 変数に入っているだけではない');
say(offline.read && offline.took === 1,
    '**電波が無くても、取った言語はこの端末に残って「read」と答える** ── ' +
    '`language_take` の写しから ' + offline.took + ' 本、「' + offline.whose +
    '」（写しは読むだけ。更新も保存もクルクル→「接続できません」で、そこは' +
    '変えていない）。写しが無ければここは「wait」で、一覧にも数にも入らない');
/* **そして一覧にはまだ出ません。これは緑ではなく、測った結果です。**
   `dlCap()`（www/core.js）は `has('plus')` で答えるので、段を訊けていない
   起動では 0 です ── `langsSeen(reading, 0)` が取った言語を全部畳み、足に
   「1 hidden」が出ます。**段はメモリにしかない**（規則 22、r31）ので、電波の
   無い起動で段が分かることはありません。つまり「前に読み込んだの出していいよ」
   （OWNER 2026-09-12）には壁が二枚あり、ここで外したのは一枚目です。
   二枚目 ── 「段を訊けていない間、一覧を切るか」 ── は段の決めごとなので
   ここでは決めません：`docs/scope/r33-owner.md` § リーダーへ と
   `docs/BACKLOG.md`。測った値: dlCap 0 / langCap 1 / 足「1 hidden」。 */
say(offline.listed === false && offline.capHid,
    '（測っただけ・直していない）一覧にはまだ出ない ── 段を訊けていないので ' +
    'dlCap() は ' + offline.dlCap + '、足は「' + offline.capHid + '」。' +
    '壁の二枚目で、段の決めごと（docs/BACKLOG.md）');

/* 三段目と四段目 ── 電波が戻る。
   **記憶の側を空にしてから訊く。**起動のあいだに走る移行と ltStart() は、
   何か直すことがあれば直したものを保存する ── それはこの iPhone が持っていて
   サーバーがまだ知らないものなので、上がって正しい。ここで見たいのはその手前、
   **移行が何もしなかった起動**、つまり写しだけがある状態で、写しがどう扱われる
   かである。だから手で空にする。 */
await pg.unroute('https://*.supabase.co/**');
const road = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved), k, i, out = {};
  for (k in LSL) if (Object.prototype.hasOwnProperty.call(LSL, k)) delete LSL[k];
  var wk = langKeyOf(langId, 'words');
  out.screenSees = (slRd(wk) || '').indexOf('kelasu') >= 0;
  out.roadSees = slMine(wk) !== null;

  /* 四. サーバーがこの言語の欄を一本も持っていない所へ同期する。写しが上りの
     道から見えていれば、ここで写しがまるごと送られる。 */
  S.lang = keep.lang; S.slice = []; S.sent = [];
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(300);
  out.sent = S.sent.filter(function(x){ return x.indexOf('slice:') === 0; });

  /* 三. 別の iPhone がこの言語に一語足した、という形にして降ろす。 */
  for (k in LSL) if (Object.prototype.hasOwnProperty.call(LSL, k)) delete LSL[k];
  S.slice = keep.slice.map(function(r){ return { language:r.language, kind:r.kind, body:r.body, no:r.no }; });
  for (i = 0; i < S.slice.length; i++)
    if (S.slice[i].kind === 'words')
      S.slice[i].body = JSON.stringify(
        JSON.parse(S.slice[i].body).concat([{ hw:'newer', gl:'added on another phone' }]));
  await new Promise(function(f){ netLangsDown(function(){ f(); }); });
  await wait(300);
  out.words = WORDS.map(function(w){ return String(w.hw); });
  return out;
}, { srv: SERVER, saved: seenUp.srv });

say(road.screenSees && !road.roadSees,
    '写しは画面には見え、上りの道からは見えない ── slRd() と slMine() は別の ' +
    '問いで、それが仕組みの全部（画面 ' + (road.screenSees ? '見える' : '**見えない**') +
    '、上り ' + (road.roadSees ? '**見える**' : '見えない') + '）');
say(road.sent.length === 0,
    '**写しはサーバーへ一度も出て行かない** ── サーバーがこの言語の欄を一本も ' +
    '持っていなくても、写しは送られない（送信 ' + road.sent.length + ' 件' +
    (road.sent.length ? ': ' + JSON.stringify(road.sent) : '') + '）');
say(road.words.filter(w => w === 'newer').length === 1,
    '**写しはサーバーの答えに勝たない** ── 答えが来たらその上に書かれる: ' +
    JSON.stringify(road.words));

/* ---- そして写しは、グローバルを一周しても出て行かない --------------------
   `docs/reports/mixed-2026-09-11.md` まとまり 9。上の三つは**鍵の階**で
   測っています ── `slRd()` は写しを見て `slMine()` は見ない、という
   一方通行です。読んだだけの指摘はこうでした：

     `langRead()` は `slRd()` で読むので、電波の無い起動では `WORDS` が
     **写しから来る**。そこへ人が一語足して保存すると、`slWr()` が `LSL` に
     書き、`slMine()` はそれを見る ── **写し由来の中身が `mine` として
     上がる**のではないか。

   読んだだけでは分かりません。**押して測ります**：電波を切って開き直し
   （`WORDS` は写しから来る）→ 一語足して保存 → 電波を戻す → `slice` の本文に
   何が入ったか。

   **上がること自体は正しい。**一語足したのはその人で、それはこの iPhone に
   しかない仕事です（規則 11「失敗して残る」）。規則 22 が禁じているのは
   **写しが答えとして戻ること** ── だから訊くのは「何が上がったか」ではなく、
   **サーバーが持っている本文を、写しが上書きしないこと**です。`syMerge` が
   両方足すので、上がった本文にはサーバーの語も入っていなければなりません。 */
await pg.route('https://*.supabase.co/**', r => r.abort());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const loop = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  await wait(400);
  var out = {};
  /* 電波なしで開いた直後 ── `WORDS` は写しから来ている（上の二段目と同じ
     状態）。ここが土台で、空なら下は何も測っていません。 */
  out.fromGot = WORDS.map(function(w){ return String(w.hw); });
  out.mineBefore = slMine(langKeyOf(langId, 'words'));
  out.diskKeys = [];
  try{ for (var _i=0;_i<localStorage.length;_i++){ var _k=localStorage.key(_i);
    if (_k && _k.indexOf('lingua.'+langId+'.')===0) out.diskKeys.push(_k); } }catch(e){}
  out.lslKeys = Object.keys(LSL);
  /* 人が一語足して保存する。 */
  WORDS.push({ hw:'tunnelword', gl:'written where there was no signal' });
  save();
  out.mineAfter = slMine(langKeyOf(langId, 'words'));
  return out;
}, { srv: SERVER, saved: seenUp.srv });

/* ディスクに在るのは `.got` だけ ── 鍵の階の一方通行はそのまま成り立って
   います（上の三つ）。**測って分かったのはその上の階です。** */
say(loop.diskKeys.length > 0 && loop.diskKeys.every(function(k){
      return k.indexOf('.got') === k.length - 4; }),
    '（前提）ディスクに在るのは `.got` の写しだけ ── 鍵の階の一方通行は' +
    'そのまま: ' + JSON.stringify(loop.diskKeys.map(function(k){
      return k.split('.').slice(-2).join('.'); })));
say(loop.fromGot.indexOf('kelasu') >= 0,
    '（前提）そして電波なしで開いた直後、画面の語は写しから来ている（' +
    loop.fromGot.length + ' 語）');
/* **誰も何も触っていないのに、写しが上りの道に乗っています。**
   `docs/reports/mixed-2026-09-11.md` まとまり 9 は「人が一語足して保存すると」
   と読んでいましたが、**保存を待つまでもありません** ── 起動が `langRead()`
   で写しをグローバルへ読み、そのあと走る移行と `ltStart()` が、**直すものが
   無くても** `save()` を通ります。`slWr()` は `LSL` に書き、`slMine()` は
   それを見る。

   **これは報告であって、ここで直すものではありません。**どの起動の道が
   「何も直していないのに保存する」かを決めるのは保存の道の話で、
   `docs/scope/r31-server.md` § リーダーへ に測った結果を書いてあります。
   下の二つが、それが何を壊して何を壊さないかです。 */
say(loop.lslKeys.length > 0,
    '**誰も触っていないのに、写しが上りの道に乗っている** ── 起動の移行と ' +
    'ltStart() が、直すものが無くても save() を通る（LSL に ' +
    JSON.stringify(loop.lslKeys.map(function(k){ return k.split('.').pop(); })) +
    '）。まとまり 9 は「保存したら」と読んでいたが、保存を待たない');
say(loop.mineAfter !== null && String(loop.mineAfter).indexOf('tunnelword') >= 0,
    'そこへ一語足して保存すると、その仕事も同じ道に乗る ── ' +
    '規則 11「失敗して残る」の側（' +
    (loop.mineAfter === null ? '**乗らない**' : '乗る') + '）');

/* 電波が戻る。サーバーは別の iPhone が足した語を持っている ── 写しが答えを
   上書きするなら、ここでそれが消えます。 */
await pg.unroute('https://*.supabase.co/**');
const loopUp = await pg.evaluate(async ({ srv, saved }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved), i;
  S.lang = keep.lang;
  S.slice = keep.slice.map(function(r){ return { language:r.language, kind:r.kind, body:r.body, no:r.no }; });
  for (i = 0; i < S.slice.length; i++)
    if (S.slice[i].kind === 'words')
      S.slice[i].body = JSON.stringify(
        JSON.parse(S.slice[i].body).concat([{ hw:'otherphone', gl:'added on another phone' }]));
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(400);
  var body = '';
  for (i = 0; i < S.slice.length; i++)
    if (S.slice[i].kind === 'words') body = String(S.slice[i].body);
  return { body:body, words:WORDS.map(function(w){ return String(w.hw); }) };
}, { srv: SERVER, saved: seenUp.srv });

say(loopUp.body.indexOf('tunnelword') >= 0,
    '電波が戻ると、トンネルで書いた語がサーバーに着く（' +
    (loopUp.body.indexOf('tunnelword') >= 0 ? '着いた' : '**着いていない**') + '）');
say(loopUp.body.indexOf('otherphone') >= 0,
    '**そして別の iPhone の語は消えない** ── 規則 22 が禁じているのは写しが' +
    '答えとして勝つことで、`syMerge` が両方足すのでここは越えていません（' +
    (loopUp.body.indexOf('otherphone') >= 0 ? '残っている' : '**消えた**') + '）');
say(loopUp.words.indexOf('otherphone') >= 0 && loopUp.words.indexOf('tunnelword') >= 0,
    'そして画面にも両方ある: ' + JSON.stringify(loopUp.words));

/* 「別のアカウントで入ると前の人の取った言語は出ない」は、この節ではなく
   **ファイルの最後**にあります ── 別のアカウントで立ち上げ直すので、落ちた
   要求を積んだページを下の節に渡してしまうからです（下は「ポップは一つ」を
   数えます）。§ 写しは、そのアカウントのものだけ。 */

/* ---- 引き下ろしも、待ちも、落ちたときのポップも、一本 ---------------------
   「引っ張って更新は SNS だけ。制作側（字を描く画面など）でも効いていて、
     描いている途中でくるくるが出て線が途切れる」 OWNER 2026-09-06。
   「通信のくるくるも全部20秒で良くない？」「再思考もポップ消えてくるくる
     みたいな。」
   「エラーになったらエラー用のポップ出して再更新とかおさせればいいやんそれ
     だけで1個作れば全部に使えるやん」 OWNER 2026-09-05。

   **画面を一つずつ押して回らないための節です。**四本あった引き下ろしは
   pullRun() 一本になったので、訊くべきは「一本の道が正しいか」と「引く画面が
   引く画面だけか」の二つです。前者は下で実際に落として押します。後者は表を
   読みます。

   **問いは 2026-09-06 に裏返りました。**それまでは「PAGES の全ルートが引く、
   除外は三つ」で、除外の表が育たないかを訊いていました。今は逆で、引くのは
   SNS の画面だけ、制作側は一本も引きません ── だから育つ恐れがあるのは
   引くほうの表です。二つ訊きます: 制作側（PAGES の tab が build）は零、
   そして引くルートの顔ぶれがこの決定のとおりであること。 */
const one = await pg.evaluate(({ s, srv }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  var out = {}, r, pulls = [], build = [];
  for (r in PAGES) if (Object.prototype.hasOwnProperty.call(PAGES, r)){
    if (!PULL_ON[r]) continue;
    pulls.push(r);
    /* 制作側かどうかは PAGES の tab が言います ── ここに一覧を書くと、
       画面が増えた日にこの check が古いほうを持ちます。 */
    if (PAGES[r].tab === 'build') build.push(r);
  }
  out.pulls = pulls.sort();
  out.build = build.sort();
  out.routes = Object.keys(PAGES).length;
  /* 表に名前が無いことと、その画面が本当に引かないことは別で、後者が決定の
     ほう。字を描く画面に立って、指が届く先を訊きます。 */
  NAV = [{ r:'glyph', a:(LETTERS[0] && LETTERS[0].id) || '' }];
  window.route = 'glyph'; render();
  out.glyphPull = pullWhere();
  NAV = [{ r:'feed', a:'' }];
  window.route = 'feed'; render();
  out.feedPull = pullWhere();
  /* 待ちは一つ。net.js が言い、store.js がそれを読む。 */
  out.wait = NET_WAIT;
  out.storeWait = STORE_WAIT;
  return out;
}, { s: seed.toString(), srv: SERVER });

say(one.build.length === 0 && one.glyphPull === '',
    '**制作側は一本も引かない** ── PAGES の ' + one.routes +
    ' ルートのうち tab が build のものは零で、字を描く画面に立った指の先は ' +
    (one.glyphPull ? '**' + one.glyphPull + '**' : '無し') +
    '（「描いている途中でくるくるが出て線が途切れる」OWNER 2026-09-06）' +
    (one.build.length ? '、**' + one.build.join(' ') + ' が引ける**' : ''));
/* 引くのはこの八つで、八つとも決定です ── 六つは 2026-09-04/05 の
   「ここ更新ないから見れないし」「他の人の画面でも更新できるようにしたい」、
   follows は数の裏の二つの一覧、mod は通報の一覧。名前で訊くのは、この表が
   放っておくと育つからで、九つ目が黙って入っていたらそれは決定ではなく誰かの
   判断です。 */
const PULL_ROUTES = ['drafts', 'explore', 'feed', 'follows', 'mod', 'notif',
                     'profile', 'thread'];
say(one.pulls.join(' ') === PULL_ROUTES.join(' ') && one.feedPull === 'feed',
    'そして引くのは SNS の ' + PULL_ROUTES.length + ' 画面だけで、その画面は ' +
    '本当に引く（' + one.pulls.join(' ') + ' ／ タイムラインに立った指の先は ' +
    (one.feedPull || '**無し**') + '）');
say(one.wait === 20000 && one.storeWait === one.wait,
    '**待ちは一箇所** ── NET_WAIT が ' + one.wait + '、App Store もそれを読む（' +
    one.storeWait + '）');

/* 落ちたときの道を、実際に落として押す。**画面ごとに書き分けられていない
   ことが訊きたいこと**なので、別々の三画面から落として、ポップが一つで
   あることと、［再接続］がその三つとも出し直すことを見ます。 */
const pop = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var id = langId;
  LANGS[id].mine = true; langOwnGot(id, 'me3');
  langRowGot(id); langStore();
  var out = {};
  /* ---- 待つのは、時間ではなく起きること ---------------------------------
     ここは固定の待ち（300ms・600ms）でした。答えは `setTimeout(0)` で返る
     ので速いのですが、道は何段もあり、答えのたびに render() が走ります ──
     測ると、［再接続］のあとマークが降りるまで **330ms**（暇な機械で）。
     ゲートは検査を四本同時に回すので、その 330ms は 600ms を越えます。
     枝ごとに緑で、取り込んだゲートでだけ赤くなったのはそれでした。

     時間を延ばすのは同じ賭けを長くするだけなので、**条件を待ちます**。
     「待つものが空になった」は NET_OUT が 0 になることで、それは印が降りる
     条件そのもの（www/net.js § netIdle）── 訊きたいことをそのまま待つ形に
     なります。天井は 8 秒で、そこまでに空にならなければそれが不具合です。 */
  function till(f, ms){
    var end = Date.now() + (ms || 8000);
    return (function step(){
      if (f()) return Promise.resolve(true);
      if (Date.now() > end) return Promise.resolve(false);
      return wait(10).then(step);
    })();
  }
  window.__SRV.down = true;
  /* 三つの別の画面が、それぞれ自分のものを訊いて、落ちる。タイムライン、
     言語を作る画面、通知 ── 昔は三本の別々の関数でした。 */
  window.__SRV.tried = [];
  go('feed'); render();     pullGo('feed');
  go('letters'); render();  pullGo('letters');
  pullGo('notif');
  await till(function(){ return popOn(); });
  out.fellTried = window.__SRV.tried.length;
  out.pops = document.querySelectorAll('#pop.on').length;
  out.popUp = popOn();
  out.spinning = document.getElementById('netspin').className.indexOf('on') >= 0;
  /* ［再接続］。人が押すのと同じ道 ── ポップのボタンをクリックする。 */
  window.__SRV.tried = [];
  var y = document.querySelector('#pop [data-do="popYes"]');
  if (y) y.click();
  out.popAfterPress = popOn();
  out.spinAfterPress = document.getElementById('netspin').className.indexOf('on') >= 0;
  out.inTheAir = NET_OUT;
  await till(function(){ return popOn(); });
  /* 通らなかったので、またポップ。そしてマークは止まっている。 */
  out.againTried = window.__SRV.tried.length;
  out.popAgain = popOn();
  out.spinAgain = document.getElementById('netspin').className.indexOf('on') >= 0;
  /* 通れば、マークは自分で降りる ── **待つものが空になったとき**。空に
     なるのを待ってから訊くので、遅いか降りないかは別のこととして出ます：
     `emptied` が false なら要求がまだ空に在り（その名前が `left`）、true で
     マークが回ったままなら netIdle() が呼ばれていない ── 別の不具合です。 */
  window.__SRV.down = false;
  var y2 = document.querySelector('#pop [data-do="popYes"]');
  if (y2) y2.click();
  var t0 = Date.now();
  out.emptied = await till(function(){ return NET_OUT === 0; });
  /* 印を降ろすのは netOff() が積んだ一手あと（www/net.js § netIdle）。 */
  await till(function(){
    return document.getElementById('netspin').className.indexOf('on') < 0;
  }, 1000);
  out.emptyMs = Date.now() - t0;
  out.left = window.__SRV.air.slice();
  out.spinAfterUp = document.getElementById('netspin').className.indexOf('on') >= 0;
  out.popAfterUp = popOn();
  return out;
}, { s: seed.toString(), srv: SERVER });

say(pop.fellTried > 0 && pop.pops === 1 && pop.popUp && !pop.spinning,
    '**三つの画面が別々に落ちて、ポップは一つ** ── 出て行った要求 ' +
    pop.fellTried + ' 件、立っているポップ ' + pop.pops + ' 個（' +
    (pop.popUp ? 'あり' : '**なし**') + '）、そのときマークは回っていない');
say(!pop.popAfterPress && pop.spinAfterPress && pop.inTheAir > 0,
    '**［再接続］でポップが消えて、マークが回る** ── 押した瞬間に ' +
    pop.inTheAir + ' 件が空へ出ている（ポップ ' +
    (pop.popAfterPress ? '**残っている**' : '消えた') + '、マーク ' +
    (pop.spinAfterPress ? '回っている' : '**止まっている**') + '）');
say(pop.againTried >= pop.fellTried && pop.popAgain && !pop.spinAgain,
    '**通らなければ、またポップ** ── ためた道が全部もう一度出て（' +
    pop.againTried + ' 件、落ちたときは ' + pop.fellTried + ' 件）、' +
    'ポップが戻り、マークは止まる');
say(pop.emptied && !pop.spinAfterUp && !pop.popAfterUp,
    'そして通れば、マークは自分で降りる ── 待つものが空になったとき（' +
    (pop.emptied ? pop.emptyMs + 'ms で空' : '**空にならない**') + '、マーク ' +
    (pop.spinAfterUp ? '**回ったまま**' : '止まった') + '、ポップ ' +
    (pop.popAfterUp ? '**あり**' : 'なし') +
    (pop.left.length ? '、空に残っているのは **' + pop.left.join(' / ') + '**'
                     : '') + '）');


/* ---- 非公開にした言語は、ログアウト→ログインで公開に戻らない ------------
   「言語を非公開にしていたのに、ログアウトしてログインしたら公開に戻ってた」
   OWNER 2026-09-08（実機、ビルド 143）。
   「端末に hide の存在があるわけないやろ。全部オンラインだって言ってるけど」
   OWNER 2026-09-08 ── これが決めごとです。

   **「この言語は非公開か」の答えは `language.published_at` 一つ。** 端末は
   意見を持ちません。2026-09-08 まで答えは二つあり、画面が読んでいたのは端末の
   `wld` スライスの `hide` のほうで、スライスはメモリにしか無い（rule 22）ので
   起動しなおした端末は「まだ聞いていない」を「公開」と答えていました。

   三本とも `published_at` から答えることを訊きます:
   1. スイッチを押した瞬間 ── サーバーへ PATCH が飛び、**答えが戻ってから**
      画面が非公開になる（先に変えて後から送る、はしない）
   2. ログアウトして立ち上げなおしてログインしても非公開
   3. 端末の写しが一つも無く、サーバーだけが答えるとき

   赤を見た形（2026-09-08）: `wldHidden()` を `world().hide` に戻すと、3 が
   赤になります ── サーバーは非公開と言っているのに、画面は公開。            */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
const hid = await pg.evaluate(async ({ s, srv }) => {
  localStorage.clear();
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'wld1', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var id;
  for (id in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, id)) langOwnGot(id, SESS.uid);
  langStore(); netSave();
  /* この人の言語はもうサーバーにあり、公開されている ── 人は言語を作った次の
     日に非公開にする。fixture が `sid` を打ってあるので netLangRow() は行を
     作りません。 */
  window.__SRV.lang = [{ id:langId, owner:SESS.uid,
                         name:langName, published_at:'2026-09-07T00:00:00Z' }];
  wldPubGot(langId, true);
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(150);

  /* 人が押すのはこれ一つ。押した「瞬間」に画面が変わってはいけません ──
     答えが戻ってからです。stub は setTimeout(0) で答えるので、押した直後の
     同じ tick で読めばそれが分かります。 */
  setWldHide(true);
  var atOnce = wldHidden();
  await wait(300);
  var S = window.__SRV;
  return { atOnce: atOnce, hide: wldHidden(),
           pub: S.lang.map(function(r){ return r.published_at; }),
           /* スライスに残っている hide は触られていないこと ── 過去のデータは
              読まなくなるだけで、消しも書き換えもしない。 */
           slice: (function(){ var w=slMine(langKey('wld')); 
                    try{ return JSON.parse(w||'{}').hide; }catch(e){ return 'BAD'; } })(),
           srv: JSON.stringify({ lang:S.lang, slice:S.slice }) };
}, { s: seed.toString(), srv: SERVER });

say(hid.atOnce === false && hid.hide === true && hid.pub.length > 0 &&
    hid.pub.every(function(p){ return p === null; }),
    '**スイッチは答えが戻ってから動く** ── 押した瞬間はまだ ' +
    (hid.atOnce ? '非公開（先に変えている）' : '公開') + '、答えが戻ったあとは ' +
    (hid.hide ? '非公開' : '**公開のまま**') + '、サーバーの published_at は ' +
    JSON.stringify(hid.pub));
say(hid.slice === undefined,
    'そして `wld` スライスには hide を書かない ── 端末は意見を持たない（' +
    JSON.stringify(hid.slice) + '）');

/* ログアウトして、アプリを立ち上げなおして、ログインする。 */
await pg.evaluate(async () => { netOut(); await new Promise(f => setTimeout(f, 150)); });
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const still = await pg.evaluate(async ({ srv, saved }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var before = wldPubKnown(langId);
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'wld1' } });
  await wait(1200);
  return { before: before, known: wldPubKnown(langId), hide: wldHidden(),
           pub: S.lang.map(function(r){ return r.published_at; }) };
}, { srv: SERVER, saved: hid.srv });

say(still.before === false && still.known === true && still.hide === true &&
    still.pub.length > 0 && still.pub.every(function(p){ return p === null; }),
    '**ログアウトして立ち上げなおしてログインしても、非公開のまま** ── ' +
    '起動直後は答えを持たず（' + still.before + '）、降りてきてから ' +
    (still.hide ? '非公開' : '**公開**') + '、サーバーの published_at は ' +
    JSON.stringify(still.pub));

/* そして端末に写しが一本も無い状態で。ここが本命です ── 上の一本は端末が
   何を持っていても緑になり得ますが、これはサーバーの答えだけが残ります。 */
await pg.evaluate(() => {
  var i, k, doomed = [];
  for (i = 0; i < localStorage.length; i++){
    k = localStorage.key(i);
    if (k && k.indexOf('lingua.') === 0 && k.indexOf('.got') === k.length - 4) doomed.push(k);
  }
  for (i = 0; i < doomed.length; i++) localStorage.removeItem(doomed[i]);
  return doomed.length;
});
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const only = await pg.evaluate(async ({ srv, saved }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var before = wldPubKnown(langId);
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'wld1' } });
  await wait(1200);
  return { before: before, hide: wldHidden(), slice: slMine(langKey('wld')),
           pub: S.lang.map(function(r){ return r.published_at; }) };
}, { srv: SERVER, saved: hid.srv });

say(only.before === false && only.hide === true && only.pub.length > 0 &&
    only.pub.every(function(p){ return p === null; }),
    '**写しも無い端末では、サーバーだけが答える** ── ログイン前は答えを持たず' +
    '（' + only.before + '）、ログイン後は ' +
    (only.hide ? '非公開' : '**公開**') + '、サーバーの published_at は ' +
    JSON.stringify(only.pub));

/* ---- 起動しても、キーボードの枚数は増えない ------------------------------
   「アップデートするたびにキーボード増殖してる。トリガーわからんけど毎回
   増えてる」 OWNER 2026-09-07（実機、ビルド 142）。

   この節は「起動して、また起動する」を持っている唯一の check なので、増える
   ものがあるかを訊くのはここです。板の id の話は kb-check が持っています ──
   ここが訊くのは一つだけ、**同じ端末を二度立ち上げて、人が数える枚数が同じ
   か**。ディスクに古い版が書いた id 無しの写しを置き、サーバーにはその板が
   前の版のランダムな id を着て載っている ── それが実機の姿です。 */
const kbGrow = await pg.evaluate(async ({ s, srv }) => {
  localStorage.clear();
  eval('(' + s + ')()');
  SET.walked = true; planGot('pro'); setKeep();
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'kb1', anon:false };
  langRowGot(langId); langOwnGot(langId, SESS.uid); langStore(); netSave();
  var lay = kbFixed().lay; lay[0].rows = lay[0].rows.slice(0, 3);
  var board = { nm:'', pat:'qwerty', lay:lay };
  /* 古いビルドがディスクに残した写し ── id が無く、slWr はメモリにしか書か
     ないので、これは起動のたびに同じものが読まれます。 */
  localStorage.setItem(langKey('kb'), JSON.stringify({ kbs:[board], at:1, v:2 }));
  var withId = JSON.parse(JSON.stringify(board)); withId.id = 'k1788700000_1';
  window.__SRV.lang = [{ id:langId, owner:'kb1', name:langName, published_at:null }];
  window.__SRV.slice = [{ language:langId, kind:'kb',
                          body:JSON.stringify({ kbs:[withId], at:1, v:2 }), no:1 }];
  return JSON.stringify({ lang:window.__SRV.lang, slice:window.__SRV.slice });
}, { s: seed.toString(), srv: SERVER });

async function kbBoot(saved){
  await pg.reload();
  await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
  return await pg.evaluate(async ({ srv, keep }) => {
    eval(srv);
    var k = JSON.parse(keep);
    window.__SRV.lang = k.lang; window.__SRV.slice = k.slice;
    netTook({ access_token:'t', refresh_token:'r', user:{ id:'kb1' } });
    await new Promise(function(f){ setTimeout(f, 900); });
    /* そして人がこの端末で何か保存する ── 一度でも保存すれば、読み込みで
       id を打たれた板がサーバーへ上がります。増えるのはそこからで、保存の
       ない起動では起きません（測ってから書いています）。 */
    saveKb();
    await new Promise(function(f){ setTimeout(f, 1800); });
    kbRead();
    return { n: kbStored().length,
             srv: JSON.stringify({ lang:window.__SRV.lang, slice:window.__SRV.slice }) };
  }, { srv: SERVER, keep: saved });
}
const kbA = await kbBoot(kbGrow);
const kbB = await kbBoot(kbA.srv);
const kbC = await kbBoot(kbB.srv);

say(kbA.n === 1 && kbB.n === 1 && kbC.n === 1,
    '**起動してもキーボードは増えない** ── 同じ端末を三度立ち上げて、人が数える '
    + '枚数は ' + [kbA.n, kbB.n, kbC.n].join(', ') + '（ディスクの id 無しの写しと '
    + 'サーバーの id 付きの写しは同じ一枚）');

/* ---- 言語の名前は `language.name` 一本 ------------------------------------
   「言語の名前もサーバーでしょ。wiki もそうなんだから」 OWNER 2026-09-08。

   答えは列一つです。2026-09-08 まで三つありました ── `lang` スライス、索引の
   `LANGS[id].name`、そして列。**改名が届くのは前の二つだけ**で、列は行を作った
   日の名前のまま。列は他人が読む唯一の半分なので、公開した言語の記事は古い名前
   を出していました。何も投げません。

   四本訊きます:
   1. 改名で列に PATCH が飛び、**答えが戻ってから**画面の名前が動く
   2. `lang` スライスへは一文字も書かない（端末は意見を持たない）
   3. ログアウトして立ち上げなおして、写しが一本も無くても、名前は列から出る
   4. 列が空の古い言語は、スライスの名前で**埋める**（あるものは書き換えない）

   赤を見た形（2026-09-08）: `saveName()` を `langName=v; save();` に戻すと 1 と
   3 が赤 ── サーバーの列は古い名前のまま、写しを消した端末は 未設定。 */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
const nmA = await pg.evaluate(async ({ s, srv }) => {
  localStorage.clear();
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'nm1', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var id;
  for (id in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, id)) langOwnGot(id, SESS.uid);
  langStore(); netSave();
  window.__SRV.lang = [{ id:langId, owner:SESS.uid,
                         name:'ときの語', published_at:null }];
  langNameGot(langId, 'ときの語');
  var S = window.__SRV;
  S.sent = [];

  /* 人が押すのはこれ一つ ── **画面の保存ボタン**です。netLangRename() を直に
     呼ぶと、押す道（saveName）が端末に書いて済ませていても緑になります。
     ここは screen を通します。押した「瞬間」に名前が変わってはいけません。 */
  editName();
  await wait(60);
  var box = document.getElementById('ln-nm');
  if (!box) return { err:'ln-nm が無い ── 改名の欄が開いていない' };
  box.value = 'リングア語';
  saveName();
  var atOnce = langNameOf(langId);
  await wait(300);
  return { err:'', atOnce: atOnce, now: langNameOf(langId), global: langName,
           col: S.lang.map(function(r){ return r.name; }),
           /* スライスは一文字も書かれない */
           slice: slMine(langKey('lang')),
           sentLang: S.sent.filter(function(x){ return x.indexOf(':lang') > 0; }),
           srv: JSON.stringify({ lang:S.lang, slice:S.slice }) };
}, { s: seed.toString(), srv: SERVER });

say(!nmA.err, '改名の欄が開く ── ' + (nmA.err || 'ln-nm があり、そこに打てる'));
say(!nmA.err && nmA.atOnce === 'ときの語' && nmA.now === 'リングア語' &&
    nmA.global === 'リングア語' && nmA.col.length > 0 &&
    nmA.col.every(function(n){ return n === 'リングア語'; }),
    '**改名は答えが戻ってから動く** ── 押した瞬間は ' +
    JSON.stringify(nmA.atOnce) + '、戻ったあとは ' + JSON.stringify(nmA.now) +
    '、サーバーの language.name は ' + JSON.stringify(nmA.col));
say(!nmA.err && nmA.slice === null && nmA.sentLang.length === 0,
    'そして `lang` スライスには書かないし、上げもしない ── 端末は意見を持たない（' +
    JSON.stringify(nmA.slice) + '、' + JSON.stringify(nmA.sentLang) + '）');

/* ログアウトして、写しを一本残らず消して、立ち上げなおしてログインする。 */
await pg.evaluate(async () => { netOut(); await new Promise(f => setTimeout(f, 150)); });
await pg.evaluate(() => {
  var i, k, doomed = [];
  for (i = 0; i < localStorage.length; i++){
    k = localStorage.key(i);
    if (k && k.indexOf('lingua.') === 0 && k.indexOf('.got') === k.length - 4) doomed.push(k);
  }
  for (i = 0; i < doomed.length; i++) localStorage.removeItem(doomed[i]);
  return doomed.length;
});
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const nmB = await pg.evaluate(async ({ srv, saved }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var before = langNameOf(langId);
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'nm1' } });
  await wait(1200);
  return { before: before, now: langNameOf(langId), global: langName };
}, { srv: SERVER, saved: nmA.srv });

say(nmB.before === '' && nmB.now === 'リングア語' && nmB.global === 'リングア語',
    '**写しも無い端末では、サーバーだけが名前を答える** ── ログイン前は ' +
    JSON.stringify(nmB.before) + '、降りてきてから ' + JSON.stringify(nmB.now));

/* 古い言語 ── 列が空で、名前は `lang` スライスにしか無い。 */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
const nmC = await pg.evaluate(async ({ s, srv }) => {
  localStorage.clear();
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var S = window.__SRV;
  S.lang = [{ id:'srvold', owner:'nm2', name:'', published_at:null },
            { id:'srvnew', owner:'nm2', name:'あとからの名', published_at:null }];
  S.slice = [{ language:'srvold', kind:'lang', body:'古い名', no:1 },
             { language:'srvnew', kind:'lang', body:'スライスの古い名', no:1 }];
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'nm2' } });
  await wait(1500);
  /* 索引の鍵はその行の id そのものです（2026-09-10、幹一本）── 突き合わせる
     ものがないので、探すのではなく引きます。 */
  function nameOfSid(sid){
    return LANGS[sid] ? langNameOf(sid) : '(no entry)';
  }
  return { col: S.lang.map(function(r){ return r.name; }),
           slice: S.slice.filter(function(r){ return r.kind === 'lang'; })
                         .map(function(r){ return r.body; }),
           shown: [nameOfSid('srvold'), nameOfSid('srvnew')] };
}, { s: seed.toString(), srv: SERVER });

say(nmC.col[0] === '古い名' && nmC.col[1] === 'あとからの名' &&
    nmC.shown[0] === '古い名' && nmC.shown[1] === 'あとからの名' &&
    nmC.slice[0] === '古い名' && nmC.slice[1] === 'スライスの古い名',
    '**空の列は古いスライスから埋め、埋まっている列は触らない** ── ' +
    'language.name は ' + JSON.stringify(nmC.col) + '、画面は ' + JSON.stringify(nmC.shown) +
    '、スライスは一字も変わらない ' + JSON.stringify(nmC.slice));

/* ---- 前からの索引が、起動で一本の番号に写る --------------------------------
   「スパゲッティみたいにするのやめて欲しい」「太い幹を分岐させて欲しい」 OWNER
   2026-09-10 → `docs/scope/r12-oneid.md`。

   ここは 150 の四つが立っていた場所です。150 が訊いていたのは「**二行になる道**」
   ── 端末の番号とサーバーの番号を突き合わせる `nidFor()` が見つけ損ねて同じ言語に
   二つ目の行を作る、その道でした。番号が一本になったのでその道は**無い**ので、
   問いを幹の形に書き直してあります: 古い索引の端末が起動して、行はその言語の
   本当の番号一つになるか。古い鍵は残るか。開いた言語は自分のもので、無料の
   a〜z が入り、保存が飛ぶか。

   索引は `localStorage` に置いてから **reload** します ── 写すのは
   `langsOneId()`（`www/core.js`）で、core.js が読まれるその場で走るからです。
   ページが立ってから `LANGS` に代入しても、それは移行が済んだあとの世界です。 */
const OLDU = '8b1f0c2e-7a34-4c19-9d55-0a1b2c3d4e5f';
await pg.evaluate(({ u }) => {
  localStorage.clear();
  /* 147 までが書いた索引 ── 鍵は端末の番号、サーバーの番号は `sid` の欄に。
     二つ目は一度も上がっていない言語（`sid` が無い）。 */
  localStorage.setItem('lingua.langs', JSON.stringify({
    Lold1: { mine:true, name:'Vaska', sid:u },
    Lold2: { mine:true, name:'Toko' } }));
  localStorage.setItem('lingua.cur', 'Lold1');
  localStorage.setItem('lingua.Lold1.words', '[{"hw":"tuf"}]');
  localStorage.setItem('lingua.Lold2.words', '[{"hw":"kef"}]');
}, { u: OLDU });
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
/* 起動しただけの姿を先に読みます ── `seed()` は開いている言語に fixture の
   言語をそのまま書くので、それを走らせたあとでは「写されたものが読める」の
   写しではなく fixture を見ることになります。 */
const oneA = await pg.evaluate(({ u }) => ({
  rows: Object.keys(LANGS),
  open: langId, cur: localStorage.getItem('lingua.cur'),
  word0: WORDS[0] && WORDS[0].hw,
  upWords: slRd('lingua.' + u + '.words'),
  old1: localStorage.getItem('lingua.Lold1.words'),
  old2: localStorage.getItem('lingua.Lold2.words'),
}), { u: OLDU });
/* そして、その言語のまま起動を歩き、保存を押す。fixture は呼びません ──
   要るのはセッションと偽の線だけで、fixture の言語はこの節が見ているものを
   上書きします。 */
const oneC = await pg.evaluate(async ({ srv, u }) => {
  SET.walked = true; planGot('free');
  eval(srv);
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var S = window.__SRV;
  S.lang = [{ id:u, owner:'idm', name:'Vaska', published_at:null }];
  S.slice = [];
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'idm' } });
  await wait(1600);
  S.tried = [];
  if (LETTERS.length) LETTERS[0].g = [[[0,0],[1,1]]];
  saveLetters();
  await wait(NET_UPMS + 600);
  var out = { mine: langMine(langId), lock: langLocked(),
              open: langId, letters: LETTERS.length,
              sent: S.tried.filter(function(t){ return t.indexOf('POST /rest/v1/slice') === 0; }).length };
  /* 次の節のために、この節が置いたものは持ち出さない（下の節と同じ理由）。 */
  localStorage.clear();
  return out;
}, { srv: SERVER, u: OLDU });

const uuidish = (x) => String(x).length === 36 && String(x).charAt(8) === '-';
say(oneA.rows.length === 2 && oneA.rows.indexOf(OLDU) >= 0 &&
    oneA.rows.every(uuidish) && oneA.open === OLDU && oneA.cur === OLDU,
    '**古い索引は起動で一本の番号になる** ── 行は言語の数だけ、鍵はその言語の' +
    '本当の番号、上がったことのない方も番号をもらう: ' + JSON.stringify(oneA.rows) +
    '、開いているのは ' + JSON.stringify(oneA.open));
/* 古い鍵は**一字も変わらない**ので厳密に。新しい番号の下は「その単語が読める」
   ── 起動が開いている言語を読み直して書き戻すので、字面まで同じとは限らず、
   同じであることを要求すると保存の書き方を測る主張になります。 */
say(oneA.old1 === '[{"hw":"tuf"}]' && oneA.old2 === '[{"hw":"kef"}]' &&
    String(oneA.upWords || '').indexOf('tuf') >= 0 && oneA.word0 === 'tuf',
    'そして古い鍵は一つも消えない ── 写しであって移動ではなく、新しい番号の' +
    '下で同じ単語が読める（古い鍵 ' + JSON.stringify(oneA.old1) + ' と ' +
    JSON.stringify(oneA.old2) + '、新しい番号の下 ' +
    JSON.stringify(String(oneA.upWords || '').slice(0, 40)) +
    '、開いている言語の一語目 ' + JSON.stringify(oneA.word0) + '）');
say(oneC.mine === true && !oneC.lock && oneC.letters === 38,
    'そして開いた言語は自分のもの ── 無料の a〜z と ！？と数字で 38（文字 ' +
    oneC.letters + '、locked ' + oneC.lock + '、mine ' + oneC.mine + '）');
say(oneC.sent > 0,
    'そして保存が飛ぶ ── 送った slice ' + oneC.sent + ' 件');

/* もう二行できてしまった端末 ── 148 が作った行（端末の番号＋`sid`）と、
   それ以前が残した行（鍵がサーバーの番号）が並んでいる状態。150 は「持って
   いない方を落とす」を足して直しました。番号が一本になると落とすものはあり
   ません: 二つは**同じ番号へ写る**ので、そこで一行になります。鍵は空でない
   方が残り、空と空なら空です。 */
await pg.evaluate(({ u }) => {
  localStorage.clear();
  localStorage.setItem('lingua.langs', JSON.stringify({
    Lmint1: { mine:true, name:'Vaska', sid:u },   /* 148 が作った行、中身あり */
    [u]:    { mine:true } }));                    /* それ以前が残した空の行 */
  localStorage.setItem('lingua.cur', u);
  localStorage.setItem('lingua.Lmint1.letters',
    JSON.stringify([{ id:'lt.a', ab:'a' }, { id:'lt.b', ab:'b' }]));
}, { u: OLDU });
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });
const oneB = await pg.evaluate(({ u }) => {
  var out = { rows: Object.keys(LANGS), open: langId,
              letters: (localStorage.getItem('lingua.' + u + '.letters') || ''),
              kept: localStorage.getItem('lingua.Lmint1.letters') };
  localStorage.clear();
  return out;
}, { u: OLDU });

say(oneB.rows.length === 1 && oneB.rows[0] === OLDU && oneB.open === OLDU,
    '**二行になっていた端末は一行になる** ── 落とすのではなく、二つが同じ番号へ' +
    '写って重なる: ' + JSON.stringify(oneB.rows));
say(oneB.letters.indexOf('lt.a') >= 0 && oneB.kept !== null,
    'そして中身を持っている方の鍵が残り、古い鍵もそのまま ── 空の行が' +
    '中身を上書きすることはない');

/* ---- 取った言語は、起動しなおしても中身ごと戻る ---------------------------
   「DLしたやつがなくなるって意味がわからん」 OWNER 2026-09-09。

   記事の ↓ は wldGet()（www/home.js）── スライスをメモリ（LSL、規則 22）に
   書き、索引に mine:false の行を足し、サーバーの language_take に行を立てる。
   アプリを閉じて開くと LSL は空で、起動の netLangsDown() は
   language?owner=eq.<自分> しか引いていなかったので、**索引の行だけ残って
   中身が来ない** ── 切り替えで開くと空の言語。

   直った形は道が一本増えたのではなく、**同じ walk（netLangsWalk）を二つの
   ask が使う**だけ。自分の行はすぐ、取った行は language_take の答えが来た時に
   ── 待つのではなく、来た時に（slow-check、起動の段を増やさない）。だから
   訊くことも三つ:
   1. 取った言語が一覧にあり、開くと letters/kb がサーバーのバイトそのまま
   2. 自分の言語のスライスは一バイトも動かない
   3. language_take に無い他人の言語（公開されていても）は来ない

   赤を見た形（2026-09-09）: netTakes() から netTakenDown() の一行を外すと
   1 が赤 ── 索引には居るのに letters は null。                            */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const tookA = await pg.evaluate(async ({ s, srv }) => {
  localStorage.clear();
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'tk1', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var id;
  for (id in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, id)) langOwnGot(id, SESS.uid);
  langStore();
  /* 自分の言語に一語入れて上げます ── あとで「一バイトも動いていない」を
     訊くので、空のスライスでは訊いたことになりません。 */
  WORDS = [{ hw:'sula', ph:['s','u','l','a'], mn:'star', mns:['star'], pos:'n', at:1 }];
  save();
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(250);
  /* この人の言語の行がサーバーに在ること ── fixture が `sid` を打っていれば
     netLangRow() は行を作らないので、無ければここで置きます。行が無いと
     「自分の言語に一バイトも触っていない」は、**何も降りてこなかったこと**を
     測るだけの主張になります。 */
  var S = window.__SRV, mySid = langId, q, hit = null;
  for (q = 0; q < S.lang.length; q++) if (S.lang[q].id === mySid) hit = S.lang[q];
  if (!hit){ hit = { id:mySid, published_at:null }; S.lang.push(hit); }
  hit.owner = SESS.uid; hit.name = 'Vaska'; hit.wsys = 'alpha';
  /* 取った言語 ── 他人の、公開されている。 */
  S.lang.push({ id:'far-1', owner:'somebody-else', name:'Shango',
                wsys:'abjad', published_at:'2026-09-07T00:00:00Z' });
  /* 取っていない他人の言語。公開されていても来てはいけません。 */
  S.lang.push({ id:'far-2', owner:'somebody-else', name:'Neru',
                wsys:'alpha', published_at:'2026-09-07T00:00:00Z' });
  S.slice.push({ language:'far-1', kind:'letters', body:'[{"id":"sh1"}]', no:4 });
  S.slice.push({ language:'far-1', kind:'kb',      body:'{"boards":[1]}',  no:2 });
  S.slice.push({ language:'far-2', kind:'letters', body:'[{"id":"nr1"}]', no:1 });
  S.take = [{ uid:SESS.uid, language:'far-1' }];
  /* そして記事の ↓ を押したあとの状態そのもの: 索引に mine:false の行があり、
     スライスはメモリにある。ここでアプリを閉じます ── slWr() は disk へ
     行かない（規則 22）ので、開き直すと索引の行だけが残ります。 */
  langSeenAdd('far-1', 'Shango', 'somebody-else');
  slWr(langKeyOf('far-1', 'letters'), '[{"id":"sh1"}]');
  slWr(langKeyOf('far-1', 'kb'), '{"boards":[1]}');
  return { lid: langId, sid: mySid, mineWords: slMine(langKey('words')),
           srv: JSON.stringify({ lang:S.lang, slice:S.slice, take:S.take }) };
}, { s: seed.toString(), srv: SERVER });

/* アプリを閉じて、開く。 */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const tookB = await pg.evaluate(async ({ srv, saved, lid }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang; S.slice = keep.slice; S.take = keep.take;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  /* 開き直した直後 ── 索引に行はあるが、中身はどこにも無い。これがバグの姿。 */
  var was = { row: !!LANGS['far-1'],
              letters: slMine(langKeyOf('far-1', 'letters')) };
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'tk1' } });
  await wait(1500);
  /* 自分の言語は、この端末が閉じる前に立っていた言語そのもの。索引は disk に
     残るので local id は生き残ります ── `sid` で引くと、行がサーバーに無い
     ときに何も見つからず、主張が「見つからなかった」で緑になります。 */
  var mine = LANGS[lid] ? lid : '';
  return {
    was: was,
    /* 1. 切り替えの一覧に居て、中身がサーバーのバイトそのまま */
    row: !!LANGS['far-1'], whose: langWhose('far-1'),
    name: langNameOf('far-1'), wsys: langWsysOf('far-1'),
    own: langOwnOf('far-1'), theirs: langMine('far-1') === false,
    letters: slMine(langKeyOf('far-1', 'letters')),
    kb: slMine(langKeyOf('far-1', 'kb')),
    /* 2. 自分の言語 */
    mineWords: mine ? slMine(langKeyOf(mine, 'words')) : '(no entry)',
    mineName: mine ? langNameOf(mine) : '',
    /* 3. 取っていない他人の言語 */
    far2row: !!LANGS['far-2'],
    far2letters: slMine(langKeyOf('far-2', 'letters')),
    /* そして誰の言語にも書きに行っていないこと */
    wrote: S.tried.filter(function(x){ return x.indexOf('far-') >= 0 &&
                                              x.indexOf('GET') !== 0; })
  };
}, { srv: SERVER, saved: tookA.srv, lid: tookA.lid });

say(tookB.was.row === true && tookB.was.letters === null,
    '（前提）開き直した直後は索引の行だけで中身は無い ── 行 ' + tookB.was.row +
    '、letters ' + JSON.stringify(tookB.was.letters));
say(tookB.row === true && tookB.letters === '[{"id":"sh1"}]' &&
    tookB.kb === '{"boards":[1]}',
    '**取った言語は起動しなおすと中身ごと戻る** ── 一覧に ' +
    JSON.stringify(tookB.name) + '、letters は ' + JSON.stringify(tookB.letters) +
    '、kb は ' + JSON.stringify(tookB.kb) + '（サーバーのバイトそのまま）');
/* 誰の物かは `langWhose()` 一箇所です（2026-09-11）── 索引の `mine` では
   なく、`language.owner`（書いた人）と `language_take`（取ったか）の二つ。 */
say(tookB.whose === 'read' && tookB.own === 'somebody-else' && tookB.theirs === true &&
    tookB.wsys === 'abjad' && tookB.wrote.length === 0,
    'そして他人のもののまま ── langWhose ' + JSON.stringify(tookB.whose) +
    '、owner ' + JSON.stringify(tookB.own) + '、書記体系は列から ' +
    JSON.stringify(tookB.wsys) + '、書きに行った回数 ' + tookB.wrote.length);
say(tookB.mineWords === tookA.mineWords && tookB.mineName === 'Vaska',
    '**自分の言語には一バイトも触っていない** ── words は ' +
    JSON.stringify(String(tookB.mineWords || '').slice(0, 40)) + '（前と同じ ' +
    (tookB.mineWords === tookA.mineWords) + '）、名前は ' +
    JSON.stringify(tookB.mineName));
say(tookB.far2row === false && tookB.far2letters === null,
    'そして language_take に無い他人の言語は、公開されていても来ない ── ' +
    '索引 ' + tookB.far2row + '、letters ' + JSON.stringify(tookB.far2letters));

/* ---- 元が消えた DL 言語は端末からも消える ---------------------------------
   「空で残さないで。消えたら消えるのよ。」 OWNER 2026-09-09
   （docs/FEATURE_RULES.md § DL 言語の四つ、決定 1）。

   DL は写しではなく印なので、元が言語を削除するかアカウントを消せば
   `language_take` の行は cascade で消える（supabase/schema.sql）。起動の
   netTakenDown() は答えに**在る**言語を埋めるだけで、答えから**消えた**
   言語の索引の行には何もしていなかった ── mine:false の行が切り替えに残り、
   開くと一語も無い言語。写し（slGot の `.got`）はディスクに残っているので、
   元がもう持っていないものが読める状態でもあった。

   訊くことは四つで、二つは「落とさない」側:
   1. 答えから消えた言語は、行も slice も写しも落ちる
   2. 空の一覧も答え ── 全部消えたときは全部落ちる
   3. 答えが来ていないとき（netTakes が落ちた＝LTAKE null）は何も落ちない
   4. 自分の言語は一バイトも動かない。サーバーへは一度も行かない

   赤を見た形（2026-09-09）: netTakenDown() から netTakeGone() の一行を外すと
   1・2 が赤 ── 索引に行が残り、`.got` の写しも残る。                      */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const goneA = await pg.evaluate(async ({ s, srv }) => {
  localStorage.clear();
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'gn1', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var id;
  for (id in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, id)) langOwnGot(id, SESS.uid);
  langStore();
  /* 自分の言語に一語 ── あとで「一バイトも動いていない」を訊くので、空の
     スライスでは訊いたことになりません。 */
  WORDS = [{ hw:'sula', ph:['s','u','l','a'], mn:'star', mns:['star'], pos:'n', at:1 }];
  save();
  await new Promise(function(f){ netLangSync(function(){ f(); }); });
  await wait(250);
  var S = window.__SRV, mySid = langId, q, hit = null;
  for (q = 0; q < S.lang.length; q++) if (S.lang[q].id === mySid) hit = S.lang[q];
  if (!hit){ hit = { id:mySid, published_at:null }; S.lang.push(hit); }
  hit.owner = SESS.uid; hit.name = 'Vaska'; hit.wsys = 'alpha';
  /* 取った言語を二つ ── 一つは元が消し、一つは残ります。二つあることが
     「その言語だけ」を測れる唯一の形です。 */
  S.lang.push({ id:'gone-1', owner:'somebody-else', name:'Shango',
                wsys:'abjad', published_at:'2026-09-07T00:00:00Z' });
  S.lang.push({ id:'stay-1', owner:'somebody-else', name:'Neru',
                wsys:'alpha', published_at:'2026-09-07T00:00:00Z' });
  S.slice.push({ language:'gone-1', kind:'letters', body:'[{"id":"sh1"}]', no:4 });
  S.slice.push({ language:'gone-1', kind:'words',   body:'[{"hw":"kel"}]', no:3 });
  S.slice.push({ language:'stay-1', kind:'letters', body:'[{"id":"nr1"}]', no:1 });
  S.take = [{ uid:SESS.uid, language:'gone-1' },
            { uid:SESS.uid, language:'stay-1' }];
  langSeenAdd('gone-1', 'Shango', 'somebody-else');
  langSeenAdd('stay-1', 'Neru', 'somebody-else');
  /* 一度目の起動 ── 二つとも降りてきて、写しがディスクに残ります。 */
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'gn1' } });
  await wait(1500);
  return { lid: langId, sid: mySid,
           mineWords: slMine(langKeyOf(langId, 'words')),
           /* 写しはディスク（slGot の `.got`）。開き直しても残るのはこれです。 */
           gotLetters: localStorage.getItem(langKeyOf('gone-1', 'letters') + '.got'),
           gotWords: localStorage.getItem(langKeyOf('gone-1', 'words') + '.got'),
           row: !!LANGS['gone-1'], stay: !!LANGS['stay-1'],
           srv: JSON.stringify({ lang:S.lang, slice:S.slice, take:S.take }) };
}, { s: seed.toString(), srv: SERVER });

say(goneA.row === true && goneA.stay === true &&
    goneA.gotLetters === '[{"id":"sh1"}]' && goneA.gotWords === '[{"hw":"kel"}]',
    '（前提）取った言語が二つ索引に居て、写しがディスクに残っている ── ' +
    'gone-1 ' + goneA.row + '、stay-1 ' + goneA.stay + '、写しは ' +
    JSON.stringify(goneA.gotLetters) + ' と ' + JSON.stringify(goneA.gotWords));

/* 3 を先に。答えが来ていない起動 ── 元は既に消えているのに、netTakes() が
   落ちる。ここで消したら、圏外の起動で取った言語が消えます。 */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const goneNull = await pg.evaluate(async ({ srv, saved }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang.filter(function(L){ return L.id !== 'gone-1'; });
  S.slice = keep.slice.filter(function(r){ return r.language !== 'gone-1'; });
  S.take = keep.take.filter(function(t){ return t.language !== 'gone-1'; });
  /* language_take の ask だけが落ちます ── 全部落とすと「自分の言語が
     動いていない」が「何も降りてこなかった」を測るだけになります。 */
  S.downTake = true;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'gn1' } });
  await wait(1500);
  return { took: langTook(), row: !!LANGS['gone-1'],
           got: localStorage.getItem(langKeyOf('gone-1', 'letters') + '.got'),
           stay: !!LANGS['stay-1'] };
}, { srv: SERVER, saved: goneA.srv });

/* `langTook()` はこの起動で **2** です。写しを置いた 2026-09-12 より前は
   `null` で、その `null` が「0 ではない」を言っていました ── 言いたいこと
   （**「無い」ではない**）は変わっておらず、答えているものが「訊けていない」
   から「前に聞いた答え」に変わっただけです。落ちないことが主張の本体で、
   それは行と写しが見ています。「本当に訊けていない端末」── 写しがまだ一枚も
   無いアカウント ── は今も `null` で、それは `acct-check` 65 が見ています。 */
say(goneNull.took === 2 && goneNull.row === true &&
    goneNull.got === '[{"id":"sh1"}]' && goneNull.stay === true,
    '**答えが来ていない起動では何も落ちない** ── langTook() は ' +
    JSON.stringify(goneNull.took) + '（0 ではなく、前に聞いた答えの数）、' +
    '行 ' + goneNull.row + '、写し ' + JSON.stringify(goneNull.got));

/* 1。同じ状態で、答えが来る起動。 */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const goneB = await pg.evaluate(async ({ srv, saved, lid }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  S.lang = keep.lang.filter(function(L){ return L.id !== 'gone-1'; });
  S.slice = keep.slice.filter(function(r){ return r.language !== 'gone-1'; });
  S.take = keep.take.filter(function(t){ return t.language !== 'gone-1'; });
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var was = { row: !!LANGS['gone-1'],
              got: localStorage.getItem(langKeyOf('gone-1', 'letters') + '.got') };
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'gn1' } });
  await wait(1500);
  var mine = LANGS[lid] ? lid : '';
  return {
    was: was,
    /* 1. 元が消した言語 ── 行も、slice も、写しも */
    row: !!LANGS['gone-1'],
    letters: slRd(langKeyOf('gone-1', 'letters')),
    words: slRd(langKeyOf('gone-1', 'words')),
    got: localStorage.getItem(langKeyOf('gone-1', 'letters') + '.got'),
    was1: slMine(langWasKey('gone-1', 'letters')),
    stored: (localStorage.getItem('lingua.langs') || '').indexOf('gone-1') >= 0,
    /* まだ在る取った言語は、そのまま */
    stay: !!LANGS['stay-1'], stayLetters: slRd(langKeyOf('stay-1', 'letters')),
    /* 4. 自分の言語 */
    mineWords: mine ? slMine(langKeyOf(mine, 'words')) : '(no entry)',
    mineName: mine ? langNameOf(mine) : '', mineRow: !!LANGS[lid],
    /* そして gone-1 についてサーバーへ一度も書きに行っていないこと */
    wrote: S.tried.filter(function(x){ return x.indexOf('gone-1') >= 0 &&
                                              x.indexOf('GET') !== 0; })
  };
}, { srv: SERVER, saved: goneA.srv, lid: goneA.lid });

say(goneB.was.row === true && goneB.was.got === '[{"id":"sh1"}]',
    '（前提）落とす前は索引に行があり、写しも残っている ── 行 ' +
    goneB.was.row + '、写し ' + JSON.stringify(goneB.was.got));
say(goneB.row === false && goneB.letters === null && goneB.words === null &&
    goneB.got === null && goneB.was1 === null && goneB.stored === false,
    '**元が消した DL 言語は端末からも消える** ── 索引 ' + goneB.row +
    '、slice は ' + JSON.stringify(goneB.letters) + ' と ' +
    JSON.stringify(goneB.words) + '、写しは ' + JSON.stringify(goneB.got) +
    '、`.was` は ' + JSON.stringify(goneB.was1) +
    '、書き出した索引に文字列 gone-1 は ' + goneB.stored);
say(goneB.stay === true && goneB.stayLetters === '[{"id":"nr1"}]',
    'そして答えにまだ在る取った言語はそのまま ── 索引 ' + goneB.stay +
    '、letters は ' + JSON.stringify(goneB.stayLetters));
say(goneB.mineRow === true && goneB.mineWords === goneA.mineWords &&
    goneB.mineName === 'Vaska',
    '**自分の言語には一バイトも触っていない** ── 行 ' + goneB.mineRow +
    '、words は前と同じ ' + (goneB.mineWords === goneA.mineWords) +
    '、名前は ' + JSON.stringify(goneB.mineName));
say(goneB.wrote.length === 0,
    'そして落とすためにサーバーへは一度も行かない（他人の行は触らない） ── ' +
    'gone-1 への GET でない要求 ' + goneB.wrote.length + ' 回');

/* 2。空の一覧も答え ── 残っていた一つも元が消したとき。 */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const goneC = await pg.evaluate(async ({ srv, saved, lid }) => {
  eval(srv);
  var S = window.__SRV, keep = JSON.parse(saved);
  /* 取った二つだけを落とします。ここは「'-1' を含む id」で切っていました ──
     自分の言語の番号は uuid なので（2026-09-10）、たまたま '-1' を含むと
     自分の行まで消え、下の「自分の言語は動かない」がその日だけ赤くなります。
     名指しは二つで済みます。 */
  var TOOK2 = ['gone-1', 'stay-1'];
  S.lang = keep.lang.filter(function(L){ return TOOK2.indexOf(String(L.id)) < 0; });
  S.slice = keep.slice.filter(function(r){ return TOOK2.indexOf(String(r.language)) < 0; });
  S.take = [];
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  var was = !!LANGS['stay-1'];
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'gn1' } });
  await wait(1500);
  return { was: was, took: langTook(), stay: !!LANGS['stay-1'],
           letters: slRd(langKeyOf('stay-1', 'letters')),
           mineRow: !!LANGS[lid],
           mineWords: slMine(langKeyOf(lid, 'words')) };
}, { srv: SERVER, saved: goneA.srv, lid: goneA.lid });

say(goneC.was === true && goneC.took === 0 && goneC.stay === false &&
    goneC.letters === null,
    '**空の一覧も答え** ── 全部消えたら全部落ちる。前は ' + goneC.was +
    '、langTook() は ' + goneC.took + '（null ではなく 0）、索引 ' +
    goneC.stay + '、写しは ' + JSON.stringify(goneC.letters));
say(goneC.mineRow === true && goneC.mineWords === goneA.mineWords,
    'そのときも自分の言語は動かない ── 行 ' + goneC.mineRow +
    '、words は前と同じ ' + (goneC.mineWords === goneA.mineWords));

/* ---- 写しの無い端末で保存しても、サーバーの文字は増えない ------------------
   「サーバーの文字は増やさないでくれ。原因特定しても穴埋めるみたいな治し方を
     するからそうなるでしょう。しっかり特定してコードごと直して」OWNER 2026-09-10。

   **索引はあるが写しの無い端末**（入れ直した iPhone、写しが reclaim された
   iPhone）で起動すると、ltStart() が空の文字表に無料の三十八枠を作ります ──
   起動の降ろしは「持っているものは飛ばす」ので、サーバーの三十九はもう降りて
   きません。そこで保存を押すと、端末の 38 とサーバーの 39 が合流します。

   **その合流が 42 を返していました。**「この文字はどの枠か」を二箇所が別々に
   答えていたからです ── ltStart() は名前（ltName）で、ltSlotKey() は `l.ab`
   だけで。`ab` を持たない文字（一覧から入れた・紙から読んだ・オンボーディング
   で描いた・音から作った）は、片方には「k の枠」で、もう片方には「枠ではない
   別の文字」でした。`k` が二行、`t` が二行、`?` が二行、サーバーに、ずっと。

   **三つ訊きます。増えない・減らない・描いた形は残る。**数だけでは足りません:
   40 でも 38 でも赤にならなければいけないし、「39 のまま」は中身を捨てた 39
   でも真になります。だから同じ名前の行が二つ無いことと、描いてある行が一つも
   減っていないことを並べて訊きます。 */
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const lt42A = await pg.evaluate(({ s }) => {
  /* 前の場面が索引に残した言語ごと片づける ── ここが測るのは一つの言語です。 */
  localStorage.clear();
  eval('(' + s + ')()');
  SET.walked = true;
  var id2;
  for (id2 in LANGS)
    if (Object.prototype.hasOwnProperty.call(LANGS, id2)) langOwnGot(id2, 'me42');
  langStore(); save();
  /* サーバーが持っている本文は、一台目が上げたそのもの ── ここでは手で置きます。
     netLangSync() を通して置くと、起動の sync と競って NET_SYNCING で黙って
     戻る日があり、測る前提そのものが揺れます。**前提は測るものではありません。** */
  var body = slMine(langKeyOf(langId, 'letters')) || '[]', L = JSON.parse(body);
  return { id: langId, name: langNameOf(langId) || 'Vaska', body: body, n: L.length,
           /* どの行に線が載っているか ── 数ではなく id で。数だけだと、
              この検査が一文字描く分と、消えた一行とが打ち消し合います。 */
           drawn: L.filter(function(l){ return ltDrawn(l); })
                   .map(function(l){ return l.id; }) };
}, { s: seed.toString() });

/* 索引とセッションだけ残す ── 写し（`.got`）も、古い版がディスクに書いた鍵も
   無い端末。localStorage.clear() のあと索引を戻すのが、その端末そのものです。 */
await pg.evaluate(() => {
  var a = localStorage.getItem('lingua.langs'), b = localStorage.getItem('lingua.cur'),
      c = localStorage.getItem('lingua.set');
  localStorage.clear();
  if (a) localStorage.setItem('lingua.langs', a);
  if (b) localStorage.setItem('lingua.cur', b);
  if (c) localStorage.setItem('lingua.set', c);
});
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const lt42B = await pg.evaluate(async ({ srv, a }) => {
  eval(srv);
  var S = window.__SRV;
  S.lang = [{ id:a.id, owner:'me42', name:a.name, wsys:'alpha', published_at:null }];
  S.slice = [{ language:a.id, kind:'letters', body:a.body, no:1, at:'a1' }];
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  function srvL(){
    var q, row = null;
    for (q = 0; q < S.slice.length; q++)
      if (S.slice[q].language === a.id && S.slice[q].kind === 'letters') row = S.slice[q];
    return row ? JSON.parse(row.body) : [];
  }
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'me42' } });
  await wait(900);
  var boot = LETTERS.length;
  langOpen(a.id);
  /* 一文字に線を引いて保存 ── 人がやる道と同じ（saveLetters → bkTouch →
     netSaveUp）。溜め（NET_UPMS）より長く待ちます。 */
  if (LETTERS[0]) LETTERS[0].st = [{ pts:[[200,600],[400,200],[600,600]] }];
  saveLetters();
  await wait(NET_UPMS + 1200);
  var end = srvL(), names = {}, dup = [], i, nm;
  for (i = 0; i < end.length; i++){
    nm = String(ltName(end[i]) || '');
    if (!nm) continue;
    if (names[nm]) dup.push(nm); else names[nm] = 1;
  }
  var lost = [], w;
  for (w = 0; w < a.drawn.length; w++){
    var still = null, y;
    for (y = 0; y < end.length; y++) if (end[y].id === a.drawn[w]) still = end[y];
    if (!still || !ltDrawn(still)) lost.push(a.drawn[w]);
  }
  return { boot: boot, n: end.length, dup: dup, lost: lost,
           drawn: end.filter(function(l){ return ltDrawn(l); }).length,
           sent: S.sent.filter(function(x){ return x.indexOf(':letters') >= 0; }).length };
}, { srv: SERVER, a: lt42A });

say(lt42B.sent > 0 && lt42B.n === lt42A.n,
    '**写しの無い端末で保存しても、サーバーの文字は増えも減えもしない** ── ' +
    '起動で端末は ' + lt42B.boot + ' 文字、保存のあとサーバーは ' + lt42A.n +
    ' → ' + lt42B.n + '（送信 ' + lt42B.sent + ' 回）');
say(lt42B.dup.length === 0,
    'そして同じ名前の文字は二つ並ばない ── 「どの枠か」は ltSlotKey() 一箇所が' +
    '答える（重なった名前: ' + (lt42B.dup.join(' ') || 'なし') + '）');
say(lt42B.lost.length === 0,
    'そして描いた形はどれも残る ── サーバーが持っていた ' + lt42A.drawn.length +
    ' 行のうち、線を落としたもの ' + (lt42B.lost.join(' ') || 'なし'));

/* ---- 電波なしで押した「追加」は、画面を進めない ------------------------
   「全部サーバーでやってる。電波なしならクルクル回るやろ」 OWNER 2026-09-11,
   and 「通信エラーなら進むわけねえだろ全部」 2026-09-05 about the same press.

   測った形（2026-09-11、`tools/hunt.mjs` 道14）: 電波を切って単語を足すと
   `WORDS=2`、語の頁が開き、ポップは「接続できません」── そして読み込み直すと
   `WORDS=1`。断りは出ているのに画面が先へ進んでいました。CLAUDE.md 規則 11
   は「保存しないのが仕様、保存して黙るのはだめ」で、これはその二つが同時に
   起きている形です。

   訊くのは三つ、そして**逆向きも**訊きます ── 届いたときは進むこと。進まない
   だけの check は、ボタンを壊せば緑になります。 */
const addOff = await pg.evaluate(async ({ s, srv }) => {
  eval('(' + s + ')()');
  SET.walked = true;
  eval(srv);
  SESS = { at:'t', rt:'r', uid:'me3', anon:false };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  const settle = () => wait(NET_UPMS + 600);
  const out = {};
  var id = langId;
  LANGS[id].mine = true; langOwnGot(id, 'me3'); langStore();
  await new Promise(function(f){ netLangSync(f); });

  /* 紙を開いて一語打つ。画面から打つのと同じ道 ── openAdd() が紙を立て、
     綴りは wEdit.sp に入る。 */
  function paper(hw){
    go('words'); openAdd('');
    /* 綴りは文字の並び。その言語の a-z はもう在るので、名前で引いて置く ──
       画面でキーを押したときと同じ形（www/letters.js § spWord）。 */
    wEdit.sp = hw.split('').map(function(c){
      var l = null, i;
      for (i = 0; i < LETTERS.length; i++)
        if (String(ltName(LETTERS[i]) || '') === c) l = LETTERS[i];
      return l ? { l: l.id } : { u: c };
    });
    wEdit.mns = ['やま'];
    render();
  }
  /* 起動のあとの普通の状態 ── 単語は LSL に在ります（保存が書く一箇所）。
     fixture は大域へ直に置くので、ここで一度そこを通します。 */
  save();
  var before = WORDS.length;

  /* 一. 電波なし。押しても、足りず、進まず、紙はそのまま。 */
  var pops = 0, realPop = netPop;
  netPop = function(d, st, m, ag){ pops++; return realPop(d, st, m, ag); };
  var saves = [], realNow = netSaveNow;
  netSaveNow = function(dn){ return realNow(function(up){ saves.push(up); dn(up); }); };
  window.__SRV.down = true;
  paper('tupira');
  addOne();
  await settle();
  out.words = WORDS.length;
  out.where = JSON.stringify(here());
  out.pop = popOn();
  out.pops = pops;
  out.saves = saves.slice();
  out.paperStill = !!(addW && wEdit && wEdit.sp && wEdit.sp.length === 6);
  out.onServer = (function(){
    var S = window.__SRV, i;
    for (i = 0; i < S.slice.length; i++)
      if (S.slice[i].language === id && S.slice[i].kind === 'words')
        return S.slice[i].body.indexOf('tupira') >= 0;
    return false;
  })();
  /* 端末にも残っていないこと ── 画面が進まないだけで記憶に残っていたら、
     次の保存がそれを連れて上がります。 */
  out.inStore = (slRd(langKeyOf(id, 'words')) || '').indexOf('tupira') >= 0;

  /* 二. 電波が戻る。同じ紙、同じ押しかたで、今度は進む。 */
  if (popOn()) popNo();
  window.__SRV.down = false;
  addOne();
  await settle();
  out.words2 = WORDS.length;
  out.where2 = JSON.stringify(here());
  out.onServer2 = (function(){
    var S = window.__SRV, i;
    for (i = 0; i < S.slice.length; i++)
      if (S.slice[i].language === id && S.slice[i].kind === 'words')
        return S.slice[i].body.indexOf('tupira') >= 0;
    return false;
  })();
  /* 三. 関係のある語 ── 「追加」は紙を片付ける前に関係を書きます。片付ける
     場所が後ろへ動いたので、両端が書かれることを訊いておきます
     （www/wordsheet.js § addOne、wRelToggle は見出し語で引くので、引かれるのは
     いま押し込んだ語であって紙ではありません）。 */
  var other = WORDS[0].hw;
  paper('mekova');
  addW.syn = [other];
  addOne();
  await settle();
  var made3 = findWord('mekova'), oth3 = findWord(other);
  out.relBoth = !!(made3 && oth3 &&
                   (made3.syn || []).indexOf(other) >= 0 &&
                   (oth3.syn || []).indexOf('mekova') >= 0);
  out.paperGone = !addW;

  out.before = before;
  return out;
}, { s: seed.toString(), srv: SERVER });

say(addOff.words === addOff.before && !addOff.inStore && !addOff.onServer,
    '電波なしで押した「追加」は、単語を足さない ── ' + addOff.before + ' 語のまま ' +
    addOff.words + ' 語（端末の欄 ' + (addOff.inStore ? 'に残った' : 'にも無い') +
    '、サーバー ' + (addOff.onServer ? 'に行った' : 'にも無い') + '）');
say(addOff.where.indexOf('"form"') >= 0 && addOff.pop && addOff.paperStill,
    'そして画面は進まず、紙は打ったまま、［接続できません］が出ている ── ' +
    addOff.where + '、ポップ ' + (addOff.pop ? 'あり' : 'なし') + '、紙 ' +
    (addOff.paperStill ? 'あり' : 'NO PAPER'));
say(addOff.relBoth && addOff.paperGone,
    'そして「追加」が書く関係は両端のまま ── 紙を片付けるのを答えの後ろへ' +
    '動かしても、引かれるのは押し込んだ語で紙ではない（両端 ' +
    (addOff.relBoth ? 'あり' : 'ONE-ENDED') + '、届いたあとの紙 ' +
    (addOff.paperGone ? '片付いた' : 'STILL THERE') + '）');
say(addOff.words2 === addOff.before + 1 && addOff.onServer2 &&
    addOff.where2.indexOf('word:tupira') >= 0,
    'そして電波が戻れば、同じ押しかたで足りて語の頁へ進む ── ' + addOff.words2 +
    ' 語、サーバー ' + (addOff.onServer2 ? 'にも在る' : 'に行っていない') + '、' +
    addOff.where2);

/* ---- 写しは、そのアカウントのものだけ ------------------------------------
   「違うアカウントでログインしてんのに前のやつ出てくるんだけど？」OWNER
   2026-08-31。取った言語の答えの写しを一枚ディスクに置いたので（2026-09-12、
   `lingua.take.<uid>`）、その日の形に戻る道が一本増えました ── 鍵に uid が
   入っていて、`langTookFor()` が手元のアカウントの分しか読まない、というのが
   それを塞いでいる全部です。読んだだけでは分からないので**押して測ります**。

   **ファイルの最後に置いてあります。**別のアカウントで立ち上げ直す節なので、
   その起動が投げて落ちた要求を積んだページを次の節へ渡してしまう ── ポップの
   節がそれを数えるので、緑と赤が入れ替わります。ここには次がありません。 */
await pg.evaluate(() => localStorage.clear());
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const takeA = await pg.evaluate(async ({ s, srv }) => {
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  eval('(' + s + ')()');
  SET.walked = true; setKeep();
  eval(srv);
  var S = window.__SRV;
  S.lang = [{ id:'tk-theirs', owner:'somebody-else', name:'Theirs',
              published_at:'2026-09-01T00:00:00Z' }];
  S.slice = [{ language:'tk-theirs', kind:'letters', body:'[{"id":"t1"}]', no:1 }];
  S.take = [{ uid:'tk1', language:'tk-theirs' }];
  langSeenAdd('tk-theirs', 'Theirs', 'somebody-else');
  netTook({ access_token:'t', refresh_token:'r', user:{ id:'tk1' } });
  await wait(1500);
  return { took:langTook(), read:langWhose('tk-theirs') === LW_READ,
           pic:localStorage.getItem('lingua.take.tk1') };
}, { s: seed.toString(), srv: SERVER });

say(takeA.took === 1 && takeA.read && takeA.pic === '["tk-theirs"]',
    '（前提）取った言語が一本あって、その答えの写しがディスクに在る ── ' +
    'langTook() ' + JSON.stringify(takeA.took) + '、写し ' +
    JSON.stringify(takeA.pic));

/* 別のアカウントで、電波の無いところで開く ── 前の人の写しが読まれるなら、
   まさにこの起動で読まれます。 */
await pg.route('https://*.supabase.co/**', r => r.abort());
await pg.evaluate(() => {
  localStorage.setItem('lingua.sess',
    JSON.stringify({ at:'t2', rt:'r2', uid:'tk2', anon:false }));
});
await pg.reload();
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

const takeB = await pg.evaluate(async () => {
  await new Promise(function(f){ setTimeout(f, 600); });
  return { uid:(SESS && SESS.uid) || '', took:langTook(),
           whose:langWhose('tk-theirs'),
           read:langWhose('tk-theirs') === LW_READ,
           listed:vLangs().indexOf('tk-theirs') >= 0,
           pic:!!localStorage.getItem('lingua.take.tk1') };
});
await pg.unroute('https://*.supabase.co/**');

say(takeB.uid === 'tk2' && takeB.took === null && !takeB.read && !takeB.listed,
    '**別のアカウントで入ると、前の人の取った言語は出ない** ── langTook() は ' +
    JSON.stringify(takeB.took) + '（訊けていない）、「' + takeB.whose +
    '」で一覧にも無い');
say(takeB.pic,
    'そして前の人の写しは消えていない ── 預けてあるだけで、戻れば戻る' +
    '（消えるのはそのアカウントを削除したとき ── lsWipeAcct が鍵の末尾の ' +
    'uid で数えて取る）');

await br.close();
if (bad.length){
  console.log('\nagain: ' + bad.length + ' problem' + (bad.length > 1 ? 's' : '') + '.\n');
  process.exit(1);
}
console.log('\nagain: every language a person made is on the server, and a phone that has\n' +
            '       never seen them gets them all back by signing in — without one byte\n' +
            '       of what is already there being written over.');
