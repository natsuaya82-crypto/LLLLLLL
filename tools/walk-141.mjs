/* ---------------------------------------------------------------------------
   tools/walk-141.mjs — ビルド 141 を、オーナーが押す順に一本で通す台本。

   使い捨てです。gate には入れません（package.json にも足しません）。

   press-check は画面ごとに作り直してから一つ押します。だからその検査に
   見えないものがあります ── 前の画面でやったことを引きずったまま次を押す、
   という並びです。ここはそれを見ます: 一つのページを開いたまま、
   docs/CHECK-0907.md の項目を順番に押していきます。

   直しません。各段で「何を押した → 画面に何が出た」を記録し、
   期待と違うところは FAIL として出します。

   走らせ方:  node tools/walk-141.mjs
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from './browser.mjs';
import { seed, halfDone } from './fixture.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const PORT = 8171;

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : f.endsWith('.css') ? 'text/css; charset=utf-8'
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
/* 電話です。段 5 が rect の数字を読むので、幅は press.mjs と同じにします。 */
const pg = await br.newPage({ viewport: { width: 402, height: 874 },
                              deviceScaleFactor: 3 });
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 15000 }).catch(() => {});
await pg.waitForTimeout(400);

/* ---- 記録 --------------------------------------------------------------
   段ごとに「押した」「見えた」を並べ、期待と違うものだけ FAIL に積みます。 */
const LOG = [];
const FAILS = [];
let STEP = '';
const step = (s) => { STEP = s; LOG.push({ kind: 'step', s }); };
const did = (what, saw) => LOG.push({ kind: 'did', s: STEP, what, saw });
const ok = (what, good, saw) => {
  LOG.push({ kind: good ? 'pass' : 'fail', s: STEP, what, saw });
  if (!good) FAILS.push({ s: STEP, what, saw });
  return good;
};
const J = (v) => { try { return JSON.stringify(v); } catch (e) { return String(v); } };

const E = (fn, arg) => pg.evaluate(fn, arg);
const beat = (ms) => pg.waitForTimeout(ms === undefined ? 260 : ms);

/* 押す。実物の click を投げて、一つのリスナーを通します。
   name は data-do の名前、a は data-a の中身（省略可）。 */
async function tap(name, a) {
  const hit = await E(([n, want]) => {
    const els = Array.prototype.slice.call(
      document.querySelectorAll('[data-do="' + n + '"]'));
    let el = null;
    for (let i = 0; i < els.length; i++) {
      if (want === null) { el = els[i]; break; }
      if (els[i].getAttribute('data-a') === JSON.stringify(want)) { el = els[i]; break; }
    }
    if (!el) return null;
    el.click();
    return { txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
  }, [name, a === undefined ? null : a]);
  await beat();
  return hit;
}

/* いま立っている所と、画面に出ている字。 */
const where = () => E(() => {
  const app = document.getElementById('app');
  return { r: here().r, a: here().a === undefined ? null : here().a,
           is: appIs(),
           txt: (app ? app.innerText : '').replace(/\s+/g, ' ').trim().slice(0, 90) };
});

/* ---- 台にする状態 -------------------------------------------------------
   act-check / press が使うのと同じ fixture。同じアプリを歩くためです。 */
await E('window.__seed = ' + seed.toString());
await E('window.__halfDone = ' + halfDone.toString());

/* ---- サーバーの返事 -----------------------------------------------------
   netSend は net.js の一つの窓です。ここを包むと、道は本物のまま
   （netMyProfile も netStaffAdd も netPlanVerify も自分のコードを通る）、
   出て行った URL が全部読めます。返事は素直なものだけ返します。 */
await E(() => {
  window.__net = [];
  window.netSend = function (method, path, body, tok, good, bad) {
    window.__net.push({ method: method, path: path, body: body || null });
    setTimeout(function () {
      if (path.indexOf('/rest/v1/profile') === 0 && method === 'GET') {
        good([{ handle: 'lingua', display: 'Aya', bio: '', av: null }]);
        return;
      }
      if (path.indexOf('/functions/v1/verify-plan') === 0) { good({ plan: 'pro' }); return; }
      /* PostgREST は書き込みに行そのものを返します（net.js は `d[0].id` を
         読みます）。空配列を返していたときは、保存が landed=false になって
         keepBack() が巻き戻していました ── アプリではなくこの偽物の穴です。 */
      if (method !== 'GET') { good([{ id: 'row-' + (window.__net.length) }]); return; }
      good([]);
    }, 0);
  };
});

/* =======================================================================
   1. 起動 → プロフィール → 設定 → パスワード変更 → 忘れた → 戻る →
      ログアウト → 扉はサインインの顔 → サインイン → プロフィール
   ======================================================================= */
step('1 扉とパスワードの道');
await E(() => { window.__seed(); SET.done = true; SET.plan = 'pro';
                goTab('profile'); });
await beat();
did('起動（署名済み・fixture）', J(await where()));
ok('プロフィールに立っている', (await where()).r === 'profile', J(await where()));

did('設定へ', J(await tap('go', ['settings'])));
ok('設定に立っている', (await where()).r === 'settings', J(await where()));

did('アカウントの部屋へ', J(await tap('go', ['set', 'acct'])));
did('パスワード変更へ', J(await tap('go', ['set', 'pw'])));
{
  const w = await where();
  ok('パスワード変更の部屋', w.r === 'set' && w.a === 'pw', J(w));
}

did('「忘れた」を押す', J(await tap('setPwForgot')));
{
  const m = await E(() => ({ mode: OBM.mode, is: appIs(),
                             back: SET.obback ? SET.obback.r + ':' + SET.obback.a : null,
                             chev: obCanBack(), to: obDoorBack() }));
  ok('扉の「忘れた」の顔', m.mode === 'forgot', J(m));
  ok('署名済みなので「忘れた」の後ろは空（サインイン画面ではない）',
     m.to === '', J(m));
}

did('一回戻る（obBack）', J(await tap('obBack')));
{
  const w = await where();
  ok('設定に戻っている（ログインを求められない）',
     w.r === 'set' && w.is === 'app', J(w));
}

did('戻るでアカウントの部屋へ', J(await tap('back')));
did('アカウントの部屋に立っている', J(await where()));
did('ログアウトを押す', J(await tap('setSignOut')));
did('ポップの「はい」', J(await tap('popYes')));
{
  const d = await E(() => {
    const app = document.getElementById('app');
    return { is: appIs(), mode: OBM.mode, sess: !!SESS,
             pw: !!app.querySelector('#ob-pw, .ob-pw'),
             code: (document.body.innerHTML.indexOf('obMailCode') >= 0),
             face: (typeof obFormHTML === 'function')
                     ? { pw: obFormHTML(false).indexOf('ob-pw') >= 0 } : null,
             txt: app.innerText.replace(/\s+/g, ' ').trim().slice(0, 90) };
  });
  ok('扉に立っている', d.is === 'door', J(d));
  ok('扉はサインインの顔（OBM.mode==="in"、メール送信の顔ではない）',
     d.mode === 'in', J(d));
}

did('サインイン（SESS を入れて obIn）', '');
await E(() => {
  SESS = { at: window.__jwt({ sub: 'u', email: 'aya@example.com',
                              app_metadata: { provider: 'email' } }),
           rt: 'r', uid: 'u', anon: false };
  netSave();
  obIn();
});
await beat(600);
{
  const w = await where();
  ok('サインインの後はプロフィールに着く', w.r === 'profile', J(w));
}

/* =======================================================================
   2. 制作 → キーボード：目次に「？」無し／一覧の bar に「？」／
      板の bar に無し／板を削除 → 一覧に戻る
   ======================================================================= */
step('2 キーボードの ？ と削除');
await E(() => { goTab('build'); go('build'); });
await beat();
{
  const d = await E(() => {
    const row = document.querySelector('#app [data-do="go"][data-a=\'["kb"]\']');
    return { row: !!row,
             txt: row ? (row.textContent || '').replace(/\s+/g, ' ').trim() : null,
             q: !!document.querySelector('#app [data-do="openHelp"][data-a=\'["kb"]\']'),
             qAny: !!document.querySelector('#app .navq') };
  });
  did('目次（制作）を見る', J(d));
  ok('目次のキーボードの行に「？」が無い', d.row && !d.q && d.txt.indexOf('?') < 0, J(d));
}

did('キーボードの行を押す', J(await tap('go', ['kb'])));
{
  const d = await E(() => ({
    r: here().r, a: here().a === undefined ? null : here().a,
    q: !!document.querySelector('.navtop [data-do="openHelp"][data-a=\'["kb"]\']'),
    rows: document.querySelectorAll('#app .kblist [data-do]').length,
    boards: kbBoards().length }));
  did('キーボード一覧', J(d));
  ok('一覧の bar に「？」がある', d.q, J(d));
  ok('一覧の switch「キーに文字を表示」が無い',
     !(await E(() => !!document.querySelector('#app [data-ch="kbSetRom"], #app [data-do="kbSetRom"]'))),
     J(d));
}

/* 削除できる板が要ります。板 0 は無料の QWERTY で消せません。 */
{
  const n = await E(() => kbBoards().length);
  if (n < 2) {
    did('板が一枚だけなので ＋ を押す', J(await tap('kbNew')));
    did('並びを選ぶ（QWERTY）', J(await tap('kbAdd', ['qwerty'])));
    await beat(300);
    did('板が増えた', J(await E(() => ({ boards: kbBoards().length,
                                        r: here().r, a: here().a }))));
  }
}
{
  const bs = await E(() => kbBoards().length);
  await E(() => { go('kb'); });
  await beat();
  did('板を開く（一覧の 2 枚目の行）', J(await tap('kbGoBoard', [1])));
  const d = await E(() => ({
    r: here().r, a: here().a === undefined ? null : here().a,
    q: !!document.querySelector('.navtop [data-do="openHelp"]'),
    more: !!document.querySelector('.navtop [data-do="kbMore"]') }));
  did('板の画面', J(Object.assign({ boards: bs }, d)));
  ok('板の画面に立っている', d.r === 'kb' && String(d.a) === '1', J(d));
  ok('板を開くと bar に「？」が無い', !d.q, J(d));
}
did('⋯ を押す', J(await tap('kbMore')));
did('削除を押す', J(await tap('kbDrop', [1])));
did('ポップの「はい」', J(await tap('popYes')));
{
  const w = await where();
  ok('削除したら一覧に戻る（1 枚目の板が開かない）',
     w.r === 'kb' && (w.a === null || w.a === '' || w.a === undefined), J(w));
}

/* =======================================================================
   3. 単語 → 開く → 編集 → 例文の .sfont / 意味の＋ / 例文の＋ / 保存
   ======================================================================= */
step('3 単語の編集シート');
await E(() => { window.__seed(); SET.done = true; SET.plan = 'pro';
                SET.myfont = true; installScriptFont();
                goTab('build'); go('words'); });
await beat();
did('辞書に立つ（自作フォント on）',
    J(await E(() => ({ r: here().r, myfont: myFontOn(),
                       built: SFONT.built, words: WORDS.length }))));
{
  const hw = await E(() => (WORDS[0] ? WORDS[0].hw : ''));
  did('単語を開く', J(await tap('openWord', [hw])));
  did('編集を押す', J(await tap('openEdit', [hw])));
  const w = await where();
  ok('編集シートが開いている', w.r === 'form' && String(w.a).indexOf('edit') === 0, J(w));
}
/* 例文はこの後で作ります ── fixture の単語は例文を持っていません。 */
{
  const before = await E(() => ({ mns: (wEdit && wEdit.mns) ? wEdit.mns.slice() : [],
                                  box: !!document.getElementById('wd-mn') }));
  did('意味の＋を押す前', J(before));
  did('意味の ＋ を押す', J(await tap('wdMnOpen')));
  const d = await E(() => ({ mns: (wEdit && wEdit.mns) ? wEdit.mns.slice() : [],
                             box: !!document.getElementById('wd-mn'),
                             focus: document.activeElement ? document.activeElement.id : null }));
  did('意味の欄', J(d));
  ok('一つ目の意味が消えない',
     before.mns.length > 0 &&
     before.mns.every((m) => d.mns.indexOf(m) >= 0), J({ before: before.mns, after: d.mns }));
  ok('二つ目の欄が開く', d.box, J(d));
}
{
  did('例文の ＋ を押す', J(await tap('wdExOpen')));
  const d = await E(() => ({ ln: !!document.getElementById('wd-exl'),
                             gl: !!document.getElementById('wd-exg'),
                             focus: document.activeElement
                                      ? document.activeElement.id : null }));
  did('例文の欄', J(d));
  ok('例文の欄が開く', d.ln && d.gl, J(d));
}
{
  /* Lingua のキーボードが入れるのは私用領域の符号です（www/glyph.js
     § ltPua）。例文の欄にそれを打って、＋ でもう一度確定させます。
     CHECK-0907 #14 の「四角（NO GLYPH）が出ない」はここです。 */
  const typed = await E(() => {
    const lts = ltPuaOrder();
    if (lts.length < 3) return null;
    const s = ltPua(0) + ltPua(1) + ltPua(2);
    const a = document.getElementById('wd-exl'), b = document.getElementById('wd-exg');
    if (!a) return null;
    a.value = s;
    a.dispatchEvent(new Event('input', { bubbles: true }));
    if (b) { b.value = 'a line typed on the Lingua keyboard';
             b.dispatchEvent(new Event('input', { bubbles: true })); }
    return { pua: s, roman: lts.slice(0, 3).map(ltName).join('') };
  });
  did('例文の欄に自作キーボードの字（PUA）を打つ', J(typed));
  did('例文の ＋ をもう一度押して確定', J(await tap('wdExOpen')));
  await beat(200);
  const d = await E(() => {
    const w = wdW();
    const ex = (w && w.ex) ? w.ex.slice() : [];
    const rows = Array.prototype.slice.call(document.querySelectorAll('#app .exlist .exl'));
    const seen = rows.map((x) => x.textContent || '');
    const pua = [], bad = [], runs = [];
    const els = document.querySelectorAll('#app .exlist .sfont');
    for (let i = 0; i < els.length; i++) runs.push(els[i].textContent || '');
    seen.forEach((s) => {
      for (let j = 0; j < s.length; j++) {
        const c = s.charCodeAt(j);
        if (c >= 0xE000 && c <= 0xF8FF) pua.push(s.charAt(j));
      }
    });
    runs.forEach((s) => {
      let j = 0;
      while (j < s.length) {
        let hit = '';
        for (let k = 0; k < SFONT.seq.length; k++) {
          const q = SFONT.seq[k];
          if (s.substr(j, q.length) === q) { hit = q; break; }
        }
        if (!hit && SFONT.one[s.charAt(j)]) hit = s.charAt(j);
        if (hit) { j += hit.length; continue; }
        bad.push(s.charAt(j)); j++;
      }
    });
    return { stored: ex.map((e) => e.ln), rows: seen, runs: runs, pua: pua, bad: bad };
  });
  did('例文の行', J(d));
  ok('例文が一つ入った', d.stored.length === 1, J(d.stored));
  ok('しまわれた例文はローマ字（PUA ではない）',
     d.stored.length === 1 && !/[\uE000-\uF8FF]/.test(d.stored[0]), J(d.stored));
  ok('例文の行に PUA が出ない（四角にならない）', d.pua.length === 0, J(d.pua));
  ok('例文の .sfont に描けない字が無い', d.bad.length === 0, J({ runs: d.runs, bad: d.bad }));
}
{
  const btn = await E(() => {
    const b = document.querySelector('.navtop [data-do]');
    const all = Array.prototype.slice.call(document.querySelectorAll('.navtop [data-do]'));
    return all.map((x) => x.getAttribute('data-do'));
  });
  did('シートの bar のボタン', J(btn));
  const saved = await tap('keepPress');
  did('保存を押す（bar の 保存）', J(saved));
  await beat(200);
  const d = await E(() => {
    const el = document.getElementById('toast');
    return { on: el.classList.contains('on'), txt: el.textContent };
  });
  did('トースト', J(d));
  ok('「保存しました」が出る', d.on && !!d.txt, J(d));
}

/* =======================================================================
   4. 文法 → 語順 / 過去形 / 名詞 / 一覧の順
   ======================================================================= */
step('4 文法');
await E(() => { window.__seed(); SET.done = true; SET.plan = 'pro';
                if (STG) delete STG.order;
                goTab('build'); go('gram'); });
await beat();
{
  /* 順は stTocAt() が決めます（www/phases.js § stListHTML）── g2Chaps() の
     並びではありません。だからここは「順はこうだ」と決めつけずに、
     並びをそのまま書き出し、章が一つずつ全部あることだけを見ます。 */
  const d = await E(() => {
    const rows = Array.prototype.slice.call(document.querySelectorAll('#app .strow'));
    const seen = rows.map((x) => ({
      n: (x.querySelector('.stn') || {}).textContent || '',
      t: (x.querySelector('.stt') || {}).textContent || '',
      a: x.getAttribute('data-a') || '' }));
    const chaps = g2Chaps().map((c) => c.id);
    const at = chaps.map((id) => seen.map((r) => r.a)
      .indexOf(JSON.stringify(['gram', 'v2:' + id])));
    return { rows: seen.map((r) => r.n + ' ' + r.t), chaps: chaps, at: at };
  });
  did('文法の一覧（番号と名前）', J(d.rows));
  did('章がどこに並んだか', J(d.chaps.map((c, i) => c + '@' + d.at[i])));
  ok('章はどれも一覧に一度だけある', d.at.every((x) => x >= 0), J(d.at));
  ok('番号は 1 から通しで抜けが無い',
     d.rows.every((r, i) => r.indexOf(String(i + 1) + ' ') === 0), J(d.rows.slice(0, 6)));
}
did('語順の章へ', J(await tap('go', ['gram', 'v2:order'])));
{
  const d = await E(() => ({
    r: here().r, a: here().a,
    on: Array.prototype.slice.call(document.querySelectorAll('[data-gord="on"] .gordc'))
      .map((x) => x.getAttribute('data-gr')),
    off: Array.prototype.slice.call(document.querySelectorAll('[data-gord="off"] .gordc'))
      .map((x) => x.getAttribute('data-gr')),
    stg: STG.order === undefined ? null : STG.order }));
  did('語順の板（STG.order 無し）', J(d));
  ok('上が空', d.on.length === 0, J(d));
  ok('下に札が並ぶ', d.off.length > 0, J(d));
}
did('下の札 S を押す', J(await tap('g2Put', ['S'])));
did('下の札 V を押す', J(await tap('g2Put', ['V'])));
{
  const d = await E(() => ({
    on: Array.prototype.slice.call(document.querySelectorAll('[data-gord="on"] .gordc'))
      .map((x) => x.getAttribute('data-gr')),
    off: Array.prototype.slice.call(document.querySelectorAll('[data-gord="off"] .gordc'))
      .map((x) => x.getAttribute('data-gr')) }));
  did('押した後', J(d));
  ok('押した札が上に入る', d.on.join(',') === 'S,V', J(d));
  ok('上に入った札は下から消える', d.off.indexOf('S') < 0 && d.off.indexOf('V') < 0, J(d));
}
did('上の札（一枚目）を押す', J(await tap('g2Take', [0])));
{
  const d = await E(() => ({
    on: Array.prototype.slice.call(document.querySelectorAll('[data-gord="on"] .gordc'))
      .map((x) => x.getAttribute('data-gr')),
    off: Array.prototype.slice.call(document.querySelectorAll('[data-gord="off"] .gordc'))
      .map((x) => x.getAttribute('data-gr')) }));
  did('上の札を押した後', J(d));
  ok('上の札を押すと下に戻る', d.on.join(',') === 'V' && d.off.indexOf('S') >= 0, J(d));
}
{
  const rect = await E(() => {
    const put = document.querySelector('[data-gord="on"]');
    const dem = document.querySelector('.gorder');
    const r = (e) => e ? e.getBoundingClientRect() : null;
    const a = r(put), b = r(dem);
    return { put: a ? { top: Math.round(a.top), bottom: Math.round(a.bottom) } : null,
             demo: b ? { top: Math.round(b.top), bottom: Math.round(b.bottom) } : null };
  });
  did('罫線と例文の位置', J(rect));
  ok('例文は罫線（上の列）の下にある',
     !!(rect.put && rect.demo && rect.demo.top >= rect.put.bottom), J(rect));
}
{
  const sv = await E(() => {
    const all = Array.prototype.slice.call(document.querySelectorAll('.navtop [data-do]'));
    return all.map((x) => x.getAttribute('data-do'));
  });
  did('語順の bar のボタン', J(sv));
  did('保存を押す（bar の 保存）', J(await tap('keepPress')));
  await beat(200);
  const d = await E(() => ({ stg: STG.order || null }));
  did('保存の後の STG.order', J(d));
  ok('保存で残る', !!(d.stg && d.stg.length), J(d));
}
did('別の画面へ（辞書）', J(await tap('go', ['words'])));
did('語順に戻る', J(await E(() => { go('gram', 'v2:order'); })));
await beat();
{
  const d = await E(() => ({
    on: Array.prototype.slice.call(document.querySelectorAll('[data-gord="on"] .gordc'))
      .map((x) => x.getAttribute('data-gr')),
    stg: STG.order || null }));
  did('戻ってきた語順', J(d));
  ok('別の画面へ行って戻っても同じ順', d.on.join(',') === (d.stg || []).join(','), J(d));
}
await E(() => { go('gram', 'v2:pst'); });
await beat();
{
  const d = await E(() => {
    const b = document.getElementById('app');
    return { rule: b.querySelectorAll('.strow, .g2row, .fmrow').length,
             table: b.querySelectorAll('table, .g2tab, .fmtab').length,
             eg: b.querySelectorAll('.stslot, .g2eg, .gor').length,
             add: b.querySelectorAll('[data-do="fmrNew"]').length,
             addAny: Array.prototype.slice.call(b.querySelectorAll('[data-do]'))
                       .map((x) => x.getAttribute('data-do')),
             html: b.innerText.replace(/\s+/g, ' ').trim().slice(0, 140) };
  });
  did('過去形の章', J(d));
  ok('過去形の章に ＋ がある', d.add > 0, J(d));
}
await E(() => { go('gram', 'v2:n'); });
await beat();
{
  const d = await E(() => {
    const b = document.getElementById('app');
    const rows = b.querySelectorAll('.strow, .stslot, .g2row');
    return { rows: rows.length,
             txt: b.innerText.replace(/\s+/g, ' ').trim(),
             subj: b.innerText.indexOf('主語') >= 0,
             kaku: b.innerText.indexOf('格') >= 0 };
  });
  did('名詞の章', J(d));
  ok('名詞の章は 3 行', d.rows === 3, J(d));
  ok('「主語」の語が無い', !d.subj, J(d));
  ok('「格」の語が無い', !d.kaku, J(d));
}

/* =======================================================================
   5. SNS：スレッドの線、投稿画面の focus、辞書の欄から余白へ
   ======================================================================= */
step('5 SNS');
await E(() => { window.__seed(); SET.done = true; SET.plan = 'pro';
                goTab('feed'); go('thread', 'p1'); });
await beat();
{
  const d = await E(() => {
    const rows = Array.prototype.slice.call(document.querySelectorAll('#app .pind'));
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const join = rows[i].querySelector('.pjoin');
      const face = rows[i].querySelector('.pav');
      const par = i > 0 ? rows[i - 1] : null;
      out.push({
        i: i,
        col: rows[i].className,
        join: join ? (function () { const r = join.getBoundingClientRect();
          return { top: Math.round(r.top), bottom: Math.round(r.bottom),
                   left: Math.round(r.left), w: Math.round(r.width) }; })() : null,
        face: face ? (function () { const r = face.getBoundingClientRect();
          return { top: Math.round(r.top), bottom: Math.round(r.bottom),
                   left: Math.round(r.left) }; })() : null,
        rails: rows[i].querySelectorAll('.prail').length });
    }
    return { rows: rows.length, out: out };
  });
  did('スレッドの行と線', J(d));
  const kids = d.out.filter((x) => x.i > 0);
  ok('返信の行すべてに入りの線がある',
     kids.length > 0 && kids.every((x) => !!x.join), J(kids.map((x) => x.i + ':' + !!x.join)));
  /* 親の顔の下から、自分の顔の上まで。 */
  const spans = [];
  for (const x of d.out) {
    if (!x.join || !x.face) continue;
    spans.push({ i: x.i, joinTop: x.join.top, joinBottom: x.join.bottom,
                 faceTop: x.face.top });
  }
  did('線の縦の伸び', J(spans));
  ok('線は自分の顔の上で止まる',
     spans.length > 0 && spans.every((s) => s.joinBottom <= s.faceTop + 2), J(spans));
  const deep = d.out.filter((x) => /pind[23]/.test(x.col));
  ok('深さ 3 の行がある（孫）', deep.length > 0, J(deep.map((x) => x.col)));
}
await E(() => { window.__seed(); SET.done = true; SET.plan = 'pro';
                goTab('feed'); openPost(); });
await beat(300);
{
  const before = await E(() => {
    const b = document.querySelector('#app .body') || document.getElementById('app');
    const mn = document.getElementById('pw-mn');
    const r = mn ? mn.getBoundingClientRect() : null;
    return { scroll: b.scrollTop, win: window.scrollY,
             mn: r ? { top: Math.round(r.top), left: Math.round(r.left) } : null };
  });
  did('投稿画面（focus 前）', J(before));
  await E(() => { const e = document.getElementById('pw-mn'); if (e) e.focus(); });
  await beat(200);
  const after = await E(() => {
    const b = document.querySelector('#app .body') || document.getElementById('app');
    const mn = document.getElementById('pw-mn');
    const r = mn ? mn.getBoundingClientRect() : null;
    return { scroll: b.scrollTop, win: window.scrollY,
             focus: document.activeElement ? document.activeElement.id : null,
             mn: r ? { top: Math.round(r.top), left: Math.round(r.left) } : null };
  });
  did('意味の欄に focus した後', J(after));
  ok('本体の scrollTop が 0 のまま', after.scroll === 0 && before.scroll === 0,
     J({ before: before.scroll, after: after.scroll }));
  ok('縦の欄の位置が変わらない',
     !!(before.mn && after.mn && before.mn.top === after.mn.top), J({ before: before.mn, after: after.mn }));
}
await E(() => { window.__seed(); SET.done = true; SET.plan = 'pro';
                goTab('build'); go('words'); });
await beat();
{
  const d = await E(() => {
    const f = document.querySelector('#app input, #app textarea');
    if (!f) return { field: null };
    f.focus();
    return { field: f.id || f.className,
             active: document.activeElement ? document.activeElement.nodeName : null };
  });
  did('辞書で欄に focus', J(d));
  const after = await E(() => {
    /* 余白 ── 何の名前も持っていない所を pointerdown。kbLetGo は
       document のリスナーなので、本物の pointerdown を投げます。 */
    const app = document.getElementById('app');
    const ev = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
    const pad = app.querySelector('.body') || app;
    pad.dispatchEvent(ev);
    return { active: document.activeElement ? document.activeElement.nodeName : null,
             target: pad.className };
  });
  await beat(80);
  did('余白を pointerdown', J(after));
  ok('activeElement が body になる', after.active === 'BODY', J(after));
}

/* =======================================================================
   6. 取り込み：paste まで進めて閉じる → もう一度開くと選択画面
   ======================================================================= */
step('6 取り込み');
await E(() => { window.__seed(); SET.done = true; SET.plan = 'pro';
                goTab('build'); go('find'); });
await beat();
did('取り込みを開く', J(await E(() => { openImport(); })));
await beat();
{
  const d = await E(() => ({ step: IMP.step, r: here().r, a: here().a }));
  did('一枚目', J(d));
  ok('開いたら選択画面（get）', d.step === 'get', J(d));
}
did('「貼り付け」を押す', J(await tap('impStep', ['paste'])));
{
  const d = await E(() => ({ step: IMP.step, box: !!document.getElementById('f-csv') }));
  did('貼り付け欄', J(d));
  ok('貼り付けの画面になる', d.step === 'paste' && d.box, J(d));
}
did('閉じる（別の画面へ）', J(await E(() => { goTab('build'); go('find'); })));
await beat();
did('もう一度開く', J(await E(() => { openImport(); })));
await beat();
{
  const d = await E(() => ({ step: IMP.step,
                             paste: !!document.querySelector('[data-do="impStep"]') }));
  did('二回目の一枚目', J(d));
  ok('もう一度開くと選択画面', d.step === 'get', J(d));
}

/* =======================================================================
   7. 管理：@ を打って追加 → netSend が /rpc/staff_add に一回
   ======================================================================= */
step('7 管理（スタッフ追加）');
await E(() => { window.__seed(); SET.done = true; SET.plan = 'pro';
                ME.handle = 'lingua'; saveMe();
                NET_ADMIN = true; ADMIN_OK = true;
                window.__net.length = 0;
                goAdmin(); });
await beat(400);
{
  const d = await E(() => ({ r: here().r, locked: adminLocked(),
                             field: !!document.getElementById('admin-h') }));
  did('管理の画面', J(d));
  ok('管理の画面に立てる', d.r === 'admin' && !d.locked, J(d));
}
await E(() => {
  const e = document.getElementById('admin-h');
  if (e) { e.value = '@lingua'; e.dispatchEvent(new Event('input', { bubbles: true })); }
});
await beat(80);
did('@lingua を打つ', J(await E(() => ({ h: ADMIN_H }))));
await E(() => { window.__net.length = 0; });
did('追加を押す', J(await tap('adminStaffAdd')));
await beat(300);
{
  const d = await E(() => window.__net.map((x) => x.method + ' ' + x.path));
  const hits = d.filter((x) => x.indexOf('/rest/v1/rpc/staff_add') >= 0);
  did('出て行った要求', J(d));
  ok('/rpc/staff_add が一回出る', hits.length === 1, J(hits));
}

/* =======================================================================
   8. プラン：netPlanUp が www に無い／netPlanVerify は Function を呼ぶ
   ======================================================================= */
step('8 プラン');
{
  const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.js'));
  const hit = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
    src.forEach((ln, i) => { if (ln.indexOf('netPlanUp') >= 0) hit.push(f + ':' + (i + 1)); });
  }
  did('www を grep netPlanUp', J(hit));
  /* コメントの中の言及は「無い」の内です ── 呼べる名前が無いことを見ます。 */
  const live = await E(() => typeof netPlanUp);
  ok('netPlanUp が www に無い（呼べる名前として）', live === 'undefined',
     J({ typeof: live, mentions: hit }));
}
await E(() => { window.__net.length = 0; });
await E(() => { netPlanVerify([], function () {}); });
await beat(300);
{
  const d = await E(() => window.__net.map((x) => x.method + ' ' + x.path));
  const fn = d.filter((x) => x.indexOf('/functions/v1/verify-plan') >= 0);
  const rest = d.filter((x) => x.indexOf('/rest/v1/plan') >= 0);
  did('netPlanVerify が出した要求', J(d));
  ok('Function を呼ぶ道になっている', fn.length === 1, J(fn));
  ok('/rest/v1/plan には出ていない', rest.length === 0, J(rest));
}

/* ---- 出す ---------------------------------------------------------------- */
await br.close();
srv.close();

let cur = '';
for (const L of LOG) {
  if (L.kind === 'step') { console.log('\n== ' + L.s); cur = L.s; continue; }
  if (L.kind === 'did')  { console.log('   押した: ' + L.what + (L.saw ? '  → ' + L.saw : '')); continue; }
  if (L.kind === 'pass') { console.log('   PASS  ' + L.what + '  ' + L.saw); continue; }
  console.log('   FAIL  ' + L.what + '  ' + L.saw);
}
console.log('\nFAIL: ' + FAILS.length);
FAILS.forEach((f) => console.log('  - [' + f.s + '] ' + f.what + '  ' + f.saw));
process.exit(0);
