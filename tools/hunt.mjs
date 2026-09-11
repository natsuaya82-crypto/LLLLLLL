/* ---------------------------------------------------------------------------
   tools/hunt.mjs — アプリを「人として」歩いて、出るバグを見つける道具。

   **これは gate の検査ではありません。** 落ちるものが何もないので npm test に
   は足しません（`tools/gate.mjs` も `package.json` も触っていません）。
   `tools/*-check.mjs` は「書いた通りか」を訊きます。これは訊きません ──
   画面を開き、押し、打ち、戻り、もう一度開いて、**出てきたものを写真に撮る**。
   読むのは人です。

   組み: 憶えるサーバー一つ（Node 側、`tools/measure-cost.mjs` の meter を
   PostgREST の形まで広げたもの）に、browser context を二つ ―― 端末 A と
   端末 B ―― を繋ぐ。アカウントも二つ作れる。

   走らせ方:  node tools/hunt.mjs            全部
              node tools/hunt.mjs 1 2 3      道を選んで
   写真:      shots/hunt/NN-<what>.png
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { chromium, LAUNCH } from './browser.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(dir, '..');
const INDEX = 'file://' + path.join(ROOT, 'www', 'index.html');
const SHOTS = path.join(ROOT, 'shots', 'hunt');
fs.mkdirSync(SHOTS, { recursive: true });

/* ===========================================================================
   一。憶えるサーバー
   ======================================================================== */

const ANON_KEY = 'sb_publishable_3FTW3G5jfBVPoc8MiXgdNw_OZk2L1-6';

function uuid(){
  const h = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++){
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else s += h[Math.floor(Math.random() * 16)];
  }
  return s;
}
function b64url(o){
  return Buffer.from(JSON.stringify(o), 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function mkTok(uid, email){
  return 'h.' + b64url({ sub: uid, email: email,
                         app_metadata: { provider: 'email' } }) + '.s';
}
function readTok(t){
  const p = String(t || '').split('.');
  if (p.length !== 3) return null;
  try { return JSON.parse(Buffer.from(p[1].replace(/-/g, '+').replace(/_/g, '/'),
                                      'base64').toString('utf8')); }
  catch (e) { return null; }
}

export function newServer(){
  const db = {
    users: [],           /* {id, email, pass, rt} */
    profile: [], language: [], language_take: [], slice: [], slice_hist: [],
    post: [], draft: [], saved_search: [], recent_search: [], plan: [],
    react: [], follow: [], block: [], report: [], prompt: [],
    storage: {},         /* path -> bytes */
    log: [],             /* every request */
    otp: {},             /* email -> code */
    planIs: 'free'       /* verify-plan がこれを返す */
  };

  const now = () => new Date().toISOString();

  /* ---- PostgREST の問い合わせを読む ------------------------------------- */
  function parse(url){
    const q = url.indexOf('?');
    const p = (q < 0 ? url : url.slice(0, q)).replace(/^[a-z]+:\/\/[^/]*/, '');
    const par = {};
    if (q >= 0) String(url.slice(q + 1)).split('&').forEach(kv => {
      const i = kv.indexOf('=');
      if (i < 0) return;
      par[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
    });
    return { p, par };
  }
  function listOf(s){
    const m = /^\((.*)\)$/.exec(s);
    const inner = m ? m[1] : s;
    if (!inner) return [];
    return inner.split(',').map(x => x.replace(/^"|"$/g, ''));
  }
  function keep(rows, par){
    const SKIP = { select:1, order:1, limit:1, offset:1, on_conflict:1, columns:1 };
    let out = rows;
    for (const k in par){
      if (SKIP[k]) continue;
      const v = String(par[k]);
      out = out.filter(r => {
        const cell = r[k];
        if (v.indexOf('eq.') === 0) return String(cell) === v.slice(3);
        if (v.indexOf('neq.') === 0) return String(cell) !== v.slice(4);
        if (v.indexOf('in.') === 0) return listOf(v.slice(3)).indexOf(String(cell)) >= 0;
        if (v.indexOf('not.in.') === 0) return listOf(v.slice(7)).indexOf(String(cell)) < 0;
        if (v === 'is.null') return cell == null;
        if (v === 'not.is.null') return cell != null;
        if (v === 'is.true') return cell === true;
        if (v === 'is.false') return cell === false || cell == null;
        if (v.indexOf('lt.') === 0) return String(cell) < v.slice(3);
        if (v.indexOf('lte.') === 0) return String(cell) <= v.slice(4);
        if (v.indexOf('gt.') === 0) return String(cell) > v.slice(3);
        if (v.indexOf('gte.') === 0) return String(cell) >= v.slice(4);
        return true;
      });
    }
    if (par.order){
      const [col, dirn] = String(par.order).split('.');
      out = out.slice().sort((a, b) => {
        const x = a[col] == null ? '' : String(a[col]);
        const y = b[col] == null ? '' : String(b[col]);
        return (x < y ? -1 : x > y ? 1 : 0) * (dirn === 'desc' ? -1 : 1);
      });
    }
    if (par.offset) out = out.slice(Number(par.offset));
    if (par.limit) out = out.slice(0, Number(par.limit));
    return out;
  }
  function pick(rows, sel){
    if (!sel || sel === '*') return rows.map(r => Object.assign({}, r));
    const cols = String(sel).split(',').map(s => s.trim()).filter(Boolean);
    return rows.map(r => { const o = {}; cols.forEach(c => { o[c] = r[c] === undefined ? null : r[c]; }); return o; });
  }

  /* ---- 見え方（view） --------------------------------------------------- */
  function sliceCount(body){
    if (!body) return 0;
    try { const a = JSON.parse(body); return Array.isArray(a) ? a.length : 0; }
    catch (e) { return 0; }
  }
  function langSeen(uid){
    return db.language.filter(l =>
      l.published_at != null || l.owner === uid ||
      db.language_take.some(t => t.uid === uid && t.language === l.id)
    ).map(l => {
      const w = db.slice.find(s => s.language === l.id && s.kind === 'words');
      const t = db.slice.find(s => s.language === l.id && s.kind === 'letters');
      return Object.assign({}, l, { nwords: sliceCount(w && w.body),
                                    nletters: sliceCount(t && t.body) });
    });
  }
  function profSeen(uid){
    return db.profile.map(p => {
      const mine = langSeen(uid).filter(l => l.owner === p.id)
        .sort((a, b) => String(a.created_at) < String(b.created_at) ? -1 : 1)[0];
      return Object.assign({}, p, {
        fo: db.follow.filter(f => f.follower === p.id).length,
        fr: db.follow.filter(f => f.followed === p.id).length,
        lang_id: mine ? mine.id : null,
        lang_name: mine ? mine.name : null,
        lang_pub: mine ? mine.published_at != null : null
      });
    });
  }
  function postSeen(uid){
    const staff = !!(db.profile.find(p => p.id === uid) || {}).staff;
    return db.post.map(p => {
      const a = db.profile.find(x => x.id === p.author) || {};
      return {
        id: p.id, author: p.author, language: p.language, prompt: p.prompt,
        reply_to: p.reply_to, created_at: p.created_at, hidden_at: p.hidden_at || null,
        author_out: a.banned_at != null,
        body: (p.hidden_at == null || p.author === uid || staff) ? p.body : {},
        likes: db.react.filter(r => r.post === p.id && r.kind === 'like').length,
        boosts: db.react.filter(r => r.post === p.id && r.kind === 'boost').length,
        replies: db.post.filter(q => q.reply_to === p.id && q.hidden_at == null).length,
        i_like: db.react.some(r => r.post === p.id && r.kind === 'like' && r.actor === uid),
        i_boost: db.react.some(r => r.post === p.id && r.kind === 'boost' && r.actor === uid)
      };
    });
  }
  function followSeen(){
    return db.follow.map(f => {
      const a = db.profile.find(p => p.id === f.follower) || {};
      const b = db.profile.find(p => p.id === f.followed) || {};
      return { follower: f.follower, followed: f.followed,
               follower_handle: a.handle || null, followed_handle: b.handle || null };
    });
  }

  const TABLE = {
    profile: () => db.profile, language: () => db.language,
    language_take: () => db.language_take, slice: () => db.slice,
    post: () => db.post, draft: () => db.draft,
    saved_search: () => db.saved_search, recent_search: () => db.recent_search,
    plan: () => db.plan, react: () => db.react, follow: () => db.follow,
    block: () => db.block, report: () => db.report, prompt: () => db.prompt
  };
  const KEYS = {
    profile: ['id'], language: ['id'], language_take: ['uid', 'language'],
    slice: ['language', 'kind'], post: ['id'], draft: ['id'],
    saved_search: ['author', 'q'], recent_search: ['author', 'q'],
    plan: ['uid'], react: ['actor', 'post', 'kind'],
    follow: ['follower', 'followed'], block: ['actor', 'blocked'], report: ['id']
  };

  /* ---- RPC -------------------------------------------------------------- */
  function rpc(name, b, uid){
    b = b || {};
    if (name === 'email_taken')
      return db.users.some(u => u.email === String(b.p || '').toLowerCase());
    if (name === 'feed_hot' || name === 'feed_fo'){
      let rows = postSeen(uid).filter(p => p.hidden_at == null);
      if (name === 'feed_hot') rows = rows.filter(p => p.reply_to == null);
      else {
        const mine = db.follow.filter(f => f.follower === uid).map(f => f.followed);
        rows = rows.filter(p => mine.indexOf(p.author) >= 0 || p.author === uid);
        rows = rows.map(r => Object.assign({ by: null, at_key: r.created_at }, r));
      }
      rows = rows.slice().sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
      return rows.slice(0, Number(b.lim || 50));
    }
    if (name === 'notices'){
      const out = [];
      db.react.forEach(r => {
        const ps = db.post.find(p => p.id === r.post);
        if (!ps || ps.author !== uid || r.actor === uid) return;
        const a = db.profile.find(p => p.id === r.actor) || {};
        out.push({ kind: r.kind, at: r.created_at, hd: a.handle, who: a.display || a.handle,
                   av: a.av || null, post: r.post, n: 1, np: 1, more: null });
      });
      db.post.forEach(q => {
        if (!q.reply_to) return;
        const ps = db.post.find(p => p.id === q.reply_to);
        if (!ps || ps.author !== uid || q.author === uid) return;
        const a = db.profile.find(p => p.id === q.author) || {};
        out.push({ kind: 'reply', at: q.created_at, hd: a.handle, who: a.display || a.handle,
                   av: a.av || null, post: q.id, n: 1, np: 1, more: null });
      });
      db.follow.forEach(f => {
        if (f.followed !== uid) return;
        const a = db.profile.find(p => p.id === f.follower) || {};
        out.push({ kind: 'follow', at: f.created_at, hd: a.handle, who: a.display || a.handle,
                   av: a.av || null, post: null, n: 1, np: 1, more: null });
      });
      return out.sort((x, y) => String(y.at).localeCompare(String(x.at)));
    }
    if (name === 'account_delete'){
      /* auth.users が消えて、cascade で全部ついていく。 */
      const drop = t => { db[t] = db[t].filter(r =>
        r.id !== uid && r.uid !== uid && r.author !== uid && r.owner !== uid &&
        r.actor !== uid && r.follower !== uid && r.followed !== uid); };
      const langs = db.language.filter(l => l.owner === uid).map(l => l.id);
      db.slice = db.slice.filter(s => langs.indexOf(s.language) < 0);
      db.post = db.post.filter(p => p.author !== uid);
      ['profile','language','language_take','draft','saved_search','recent_search',
       'plan','react','follow','block'].forEach(drop);
      db.users = db.users.filter(u => u.id !== uid);
      return true;
    }
    if (name === 'admin_counts') return { people: db.profile.length, posts: db.post.length };
    if (name === 'post_hide'){
      const p = db.post.find(x => x.id === b.p); if (p){ p.hidden_at = now(); p.hidden_why = b.reason; }
      return true;
    }
    if (name === 'post_show'){ const p = db.post.find(x => x.id === b.p); if (p) p.hidden_at = null; return true; }
    if (name === 'report_drop'){ db.report = db.report.filter(r => String(r.id) !== String(b.r)); return true; }
    if (name === 'account_ban'){ const p = db.profile.find(x => x.id === b.p); if (p) p.banned_at = now(); return true; }
    if (name === 'account_unban'){ const p = db.profile.find(x => x.id === b.p); if (p) p.banned_at = null; return true; }
    if (name === 'staff_add' || name === 'staff_drop'){
      const p = db.profile.find(x => x.handle === b.h); if (p) p.staff = name === 'staff_add'; return true;
    }
    if (name === 'admin_hist') return [];
    if (name === 'admin_restore') return true;
    return null;
  }

  /* ---- 一つの要求に答える ------------------------------------------------ */
  function serve(m, url, bodyText, prefer, auth){
    const { p, par } = parse(url);
    let body = null;
    try { body = bodyText == null ? null : JSON.parse(bodyText); } catch (e) {}
    const tok = String(auth || '').replace(/^Bearer\s+/, '');
    const claims = tok === ANON_KEY ? null : readTok(tok);
    const uid = claims ? claims.sub : null;
    db.log.push({ m, p, uid, at: Date.now(),
                  q: url.indexOf('?') >= 0 ? url.slice(url.indexOf('?') + 1).slice(0, 160) : '',
                  b: bodyText == null ? '' : String(bodyText).slice(0, 300),
                  pref: String(prefer || '') });

    /* --- auth --- */
    if (p === '/auth/v1/token'){
      const g = par.grant_type;
      if (g === 'password'){
        const u = db.users.find(x => x.email === String(body.email || '').toLowerCase());
        if (!u || u.pass !== body.password)
          return { status: 400, text: JSON.stringify({ error: 'invalid_grant', msg: 'Invalid login credentials' }) };
        if (!u.confirmed)
          return { status: 400, text: JSON.stringify({ error: 'invalid_grant', msg: 'Email not confirmed' }) };
        return { status: 200, text: JSON.stringify({ access_token: mkTok(u.id, u.email),
                                                     refresh_token: u.rt, user: { id: u.id } }) };
      }
      if (g === 'refresh_token'){
        const u = db.users.find(x => x.rt === body.refresh_token);
        if (!u) return { status: 401, text: '{}' };
        return { status: 200, text: JSON.stringify({ access_token: mkTok(u.id, u.email),
                                                     refresh_token: u.rt, user: { id: u.id } }) };
      }
      return { status: 400, text: '{}' };
    }
    if (p === '/auth/v1/otp'){
      const email = String(body.email || '').toLowerCase();
      let u = db.users.find(x => x.email === email);
      if (!u && body.create_user !== false){
        u = { id: uuid(), email, pass: null, rt: 'rt-' + uuid(), confirmed: false };
        db.users.push(u);
      }
      db.otp[email] = '12345678';
      return { status: 200, text: '{}' };
    }
    if (p === '/auth/v1/recover'){
      db.otp[String(body.email || '').toLowerCase()] = '87654321';
      return { status: 200, text: '{}' };
    }
    if (p === '/auth/v1/verify'){
      const email = String(body.email || '').toLowerCase();
      const u = db.users.find(x => x.email === email);
      if (!u || db.otp[email] !== String(body.token))
        return { status: 400, text: JSON.stringify({ msg: 'Token has expired or is invalid' }) };
      u.confirmed = true;
      return { status: 200, text: JSON.stringify({ access_token: mkTok(u.id, u.email),
                                                   refresh_token: u.rt, user: { id: u.id } }) };
    }
    if (p === '/auth/v1/user'){
      const u = db.users.find(x => x.id === uid);
      if (!u) return { status: 401, text: '{}' };
      if (body && body.password) u.pass = body.password;
      return { status: 200, text: JSON.stringify({ id: u.id }) };
    }
    if (p === '/auth/v1/logout') return { status: 204, text: '' };
    if (p === '/functions/v1/verify-plan')
      return { status: 200, text: JSON.stringify({ plan: db.planIs || 'free' }) };

    /* --- storage --- */
    if (p.indexOf('/storage/v1/object/') === 0){
      if (m === 'POST' || m === 'PUT'){ db.storage[p] = (bodyText && bodyText.length) || 1; return { status: 200, text: '{"Key":"ok"}' }; }
      return { status: 200, text: '{}' };
    }

    /* --- rpc --- */
    if (p.indexOf('/rest/v1/rpc/') === 0){
      const out = rpc(p.slice('/rest/v1/rpc/'.length), body, uid);
      return { status: 200, text: JSON.stringify(out === null ? [] : out) };
    }

    /* --- views --- */
    const VIEW = { profile_seen: () => profSeen(uid), post_seen: () => postSeen(uid),
                   follow_seen: () => followSeen(), language_seen: () => langSeen(uid) };
    const name = p.replace('/rest/v1/', '');
    if (VIEW[name] && m === 'GET')
      return { status: 200, text: JSON.stringify(pick(keep(VIEW[name](), par), par.select)) };

    if (!TABLE[name]) return { status: 404, text: '{}' };
    const rows = TABLE[name]();
    const key = KEYS[name] || ['id'];

    /* ---- 読める行だけ返す ------------------------------------------------
       supabase/schema.sql の読みの policy と同じ形。これを入れる前は、
       別のアカウントでサインインした端末に前のアカウントの下書きと検索履歴が
       出ていた ── サーバーが全部返していただけで、アプリのせいではなかった。
       持ち主で切るのはここ一箇所。 */
    const MINE = { draft: 'author', saved_search: 'author', recent_search: 'author',
                   block: 'actor', plan: 'uid', language_take: 'uid' };
    if (m === 'GET'){
      let see = rows;
      if (MINE[name]) see = rows.filter(r => r[MINE[name]] === uid);
      if (name === 'language') see = rows.filter(l =>
        l.published_at != null || l.owner === uid ||
        db.language_take.some(t => t.uid === uid && t.language === l.id));
      if (name === 'slice') see = rows.filter(sl => {
        const l = db.language.find(x => x.id === sl.language);
        return l && (l.owner === uid || l.published_at != null ||
          db.language_take.some(t => t.uid === uid && t.language === l.id));
      });
      if (name === 'report') see = rows.filter(r =>
        r.reporter === uid || (db.profile.find(p => p.id === uid) || {}).staff);
      return { status: 200, text: JSON.stringify(pick(keep(see, par), par.select)) };
    }

    if (m === 'POST'){
      const put = Array.isArray(body) ? body : [body];
      const back = [];
      put.forEach(r => {
        const row = Object.assign({}, r);
        if (name === 'profile' && !row.id) row.id = uid;
        if (!row.id && key[0] === 'id') row.id = name === 'report' ? db.report.length + 1 : uuid();
        if (name === 'post' || name === 'react' || name === 'follow' ||
            name === 'block' || name === 'report' || name === 'saved_search')
          if (!row.created_at) row.created_at = now();
        if (name === 'recent_search' && !row.at) row.at = now();
        if (name === 'draft' && !row.updated_at) row.updated_at = now();
        if (name === 'language'){
          if (!row.created_at) row.created_at = now();
          if (row.published_at === undefined) row.published_at = null;
          if (!row.owner) row.owner = uid;
        }
        if (name === 'slice'){
          if (!row.at) row.at = now();
          let n = '?';
          try { const v = JSON.parse(row.body); n = Array.isArray(v) ? v.length : 'obj'; } catch (e) {}
          db.sliceLog = db.sliceLog || [];
          db.sliceLog.push(String(row.language).slice(0, 8) + ' ' + row.kind + ' n=' + n);
        }
        if (name === 'language_take' && !row.at) row.at = now();
        const hit = rows.find(x => key.every(k => String(x[k]) === String(row[k])));
        if (hit){
          if (String(prefer || '').indexOf('merge-duplicates') >= 0) Object.assign(hit, row);
          back.push(hit);
        } else { rows.push(row); back.push(row); }
      });
      const min = String(prefer || '').indexOf('return=minimal') >= 0;
      return { status: 201, text: min ? '' : JSON.stringify(back) };
    }
    if (m === 'PATCH'){
      const hit = keep(rows, par);
      hit.forEach(r => Object.assign(r, body));
      const min = String(prefer || '').indexOf('return=minimal') >= 0;
      return { status: hit.length ? 200 : 200, text: min ? '' : JSON.stringify(hit) };
    }
    if (m === 'DELETE'){
      const hit = keep(rows, par);
      const gone = [];
      hit.forEach(r => { const i = rows.indexOf(r); if (i >= 0){ rows.splice(i, 1); gone.push(r); } });
      if (name === 'language') gone.forEach(l => {
        db.slice = db.slice.filter(s => s.language !== l.id);
        db.language_take = db.language_take.filter(t => t.language !== l.id);
      });
      const min = String(prefer || '').indexOf('return=minimal') >= 0;
      return { status: 200, text: min ? '' : JSON.stringify(gone) };
    }
    return { status: 405, text: '{}' };
  }

  const serve2 = (m, url, bodyText, prefer, auth, n) => {
    const r = serve(m, url, bodyText, prefer, auth, n);
    if (r.status < 200 || r.status >= 300)
      db.log[db.log.length - 1].bad = r.status + ' ' + String(r.text).slice(0, 120);
    return r;
  };
  return { db, serve: serve2 };
}

/* ===========================================================================
   二。端末。browser context 一つが一台。
   ======================================================================== */

/* 偽の線。ページの中で走る。 */
function wire(){
  window.__out = 0;
  window.__err = [];
  function Fake(){ this.readyState = 0; this.status = 0; this.responseText = ''; }
  Fake.prototype.open = function(m, u){ this.__m = m; this.__u = u; };
  Fake.prototype.setRequestHeader = function(k, v){
    (this.__h = this.__h || {})[String(k).toLowerCase()] = String(v);
  };
  Fake.prototype.abort = function(){ this.__dead = true; };
  Fake.prototype.getResponseHeader = function(){ return null; };
  Fake.prototype.send = function(d){
    var self = this;
    var txt = (typeof d === 'string') ? d : null;
    var n = (d && (d.size || d.byteLength)) || 0;
    window.__out++;
    var done = function(){ window.__out--; };
    var go = function(){
      if (window.__OFFLINE){
        setTimeout(function(){
          done();
          if (self.__dead) return;
          self.readyState = 4; self.status = 0;
          if (self.onerror) self.onerror();
        }, 1);
        return;
      }
      window.__net(self.__m, String(self.__u || ''), txt,
                   (self.__h && self.__h['prefer']) || '',
                   (self.__h && self.__h['authorization']) || '', n)
        .then(function(r){
          done();
          if (self.__dead) return;
          self.readyState = 4; self.status = r.status; self.responseText = r.text;
          if (self.onreadystatechange) self.onreadystatechange();
        }, function(){ done(); });
    };
    if (window.__net) go();
    else { var t = setInterval(function(){ if (window.__net){ clearInterval(t); go(); } }, 5); }
  };
  window.XMLHttpRequest = Fake;
}

/* 240x240 の PNG。一色でよい ── 「出ているか」と「どの大きさで出ているか」
   の両方が写真で読めればよい。 */
const FAKE_PIC = (() => {
  const z = require('zlib');
  const W = 240, H = 240, raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++){
    raw[y * (W * 3 + 1)] = 0;
    for (let x = 0; x < W; x++){
      const o = y * (W * 3 + 1) + 1 + x * 3;
      raw[o] = 90 + ((x + y) % 90); raw[o + 1] = 130; raw[o + 2] = 160;
    }
  }
  const crcT = [];
  for (let n = 0; n < 256; n++){ let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF;
    for (const x of b) c = crcT[(c ^ x) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, d) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
    const body = Buffer.concat([Buffer.from(t, 'ascii'), d]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
                        chunk('IHDR', ihdr), chunk('IDAT', z.deflateSync(raw)),
                        chunk('IEND', Buffer.alloc(0))]);
})();

let SHOT = 0;
const NOTE = [];
const KEEP = {};

export class Dev {
  constructor(br, srv, name){ this.br = br; this.srv = srv; this.name = name; }
  async open(ls){
    this.ctx = await this.br.newContext({ viewport: { width: 390, height: 844 },
                                          deviceScaleFactor: 2,
                                          locale: 'ja-JP',
                                          timezoneId: 'Asia/Tokyo' });
    await this.ctx.exposeFunction('__net', (m, u, b, pref, auth, n) =>
      this.srv.serve(m, u, b, pref, auth, n));
    await this.ctx.addInitScript(wire);
    if (ls) await this.ctx.addInitScript(seedLS, ls);
    this.pg = await this.ctx.newPage();
    this.pg.on('pageerror', e => {
      const s = String((e && e.stack) || e);
      NOTE.push({ dev: this.name, err: s.split('\n').slice(0, 2).join(' | ') });
    });
    await this.pg.route('https://fonts.googleapis.com/**',
      r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await this.pg.route('https://fonts.gstatic.com/**', r => r.abort());
    /* 本物の大きさの写真を返す。1x1 を返すと「写真が出ていない」を自分で
       作ってしまう（道6で一度そう見えた）。 */
    await this.pg.route('**/storage/v1/object/public/**',
      r => r.fulfill({ status: 200, contentType: 'image/png', body: FAKE_PIC }));
    await this.go();
    return this;
  }
  async go(){
    await this.pg.goto(INDEX);
    await this.pg.waitForSelector('#splash', { state: 'detached', timeout: 25000 }).catch(() => {});
    await this.quiet();
  }
  async reload(){ await this.settle(); await this.go(); }
  /* 保存は打ち終わって 1.2 秒後に出て行く（net.js NET_UPMS）。
     それより早く読み込み直すと「保存されなかった」を自分で作ってしまう。 */
  async settle(){ await this.pg.waitForTimeout(1800); await this.quiet(); }
  async quiet(ms){
    let idle = 0;
    for (let i = 0; i < 300; i++){
      const out = await this.pg.evaluate(() => window.__out).catch(() => 0);
      if (!out) idle++; else idle = 0;
      if (idle >= 3) break;
      await this.pg.waitForTimeout(20);
    }
    await this.pg.waitForTimeout(ms || 120);
  }
  /* 画面に出ている言葉。写真と並べて読むためのもので、写真の代わりではない。 */
  async text(){
    return this.pg.evaluate(() => {
      const a = document.getElementById('app');
      let t = (a ? a.innerText : '(no #app)').replace(/\n{3,}/g, '\n\n');
      const f = [];
      (a ? a.querySelectorAll('input,textarea') : []).forEach(e => {
        f.push('  [' + (e.id || e.className || e.type) + '] = "' +
               (e.value || '') + '"' + (e.placeholder ? '  (ph: ' + e.placeholder + ')' : ''));
      });
      if (f.length) t += '\n--- 打ち込み欄 ---\n' + f.join('\n');
      const tz = document.getElementById('toast');
      if (tz && tz.className.indexOf('on') >= 0 && tz.textContent)
        t += '\n--- トースト ---\n' + tz.textContent;
      const pz = document.getElementById('pop');
      if (pz && pz.className.indexOf('on') >= 0 && pz.innerText.trim())
        t += '\n--- ポップ ---\n' + pz.innerText.replace(/\n{2,}/g, '\n');
      const sh = document.getElementById('sheet');
      if (sh && sh.className.indexOf('on') >= 0 && sh.innerText.trim())
        t += '\n--- シート ---\n' + sh.innerText.slice(0, 400);
      return t.length > 3200 ? t.slice(0, 3200) + '\n…(切った)' : t;
    });
  }
  async where(){
    return this.pg.evaluate(() =>
      (typeof here === 'function' ? JSON.stringify(here()) : '?'));
  }
  async shot(what){
    SHOT++;
    const nn = String(SHOT).padStart(2, '0');
    const f = path.join(SHOTS, nn + '-' + this.name + '-' + what + '.png');
    await this.pg.screenshot({ path: f });
    const txt = await this.text();
    fs.writeFileSync(f.replace(/\.png$/, '.txt'),
      '# ' + nn + ' ' + this.name + ' ' + what + '\nroute: ' +
      (await this.where()) + '\n\n' + txt + '\n');
    console.log('  shot ' + nn + ' ' + this.name + ' ' + what);
    return f;
  }
  /* 押す。名前で（data-do）か、文字で。 */
  async tapDo(name, nth){
    const el = this.pg.locator('[data-do="' + name + '"]').nth(nth || 0);
    if (!(await el.count())) return false;
    await el.click({ timeout: 4000 }).catch(() => {});
    await this.quiet();
    return true;
  }
  /* 名前と引数で押す ── data-a が JSON で載っている */
  async tapArg(name, args, at){
    const sel = '[data-do="' + name + '"][data-a=' +
      JSON.stringify(JSON.stringify([].concat(args))) + ']';
    const el = this.pg.locator(sel).first();
    if (!(await el.count())) return false;
    await el.click(Object.assign({ timeout: 4000 }, at ? { position: at } : {}))
      .catch(() => {});
    await this.quiet();
    return true;
  }
  async tapText(s, nth){
    const el = this.pg.locator('#app >> text=' + s).nth(nth || 0);
    if (!(await el.count())) return false;
    await el.click({ timeout: 4000 }).catch(() => {});
    await this.quiet();
    return true;
  }
  async type(sel, s){
    const el = this.pg.locator(sel).first();
    if (!(await el.count())){
      console.log('    ! no field ' + sel + '   (on screen: ' +
        (await this.pg.evaluate(() => Array.prototype.map.call(
          document.querySelectorAll('#app input,#app textarea'),
          e => '#' + (e.id || e.className)).join(' '))) + ')');
      return false;
    }
    await el.click({ timeout: 3000 }).catch(() => {});
    await el.fill(String(s)).catch(e => console.log('    ! fill ' + e.message.split('\n')[0]));
    await el.dispatchEvent('input').catch(() => {});
    await el.dispatchEvent('change').catch(() => {});
    await this.quiet(60);
    const got = await el.inputValue().catch(() => '?');
    if (got !== String(s)) console.log('    ! typed "' + s + '" but field holds "' + got + '"');
    return true;
  }
  /* この画面にある押せるものを、名前と文字で。歩きながら道を決めるために。 */
  async buttons(){
    return this.pg.evaluate(() => {
      const out = [];
      document.querySelectorAll('#app [data-do]').forEach(e => {
        out.push((e.getAttribute('data-do') || '') +
                 (e.getAttribute('data-a') ? e.getAttribute('data-a') : '') +
                 ' «' + String(e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').slice(0, 18) + '»');
      });
      return out;
    });
  }
  async goRoute(r, a){
    await this.pg.evaluate(x => go(x[0], x[1]), [r, a === undefined ? '' : a]);
    await this.quiet();
  }
  /* 出ているポップの文。無ければ空。 */
  async pop(){
    return this.pg.evaluate(() => {
      const z = document.getElementById('pop');
      /* class 'on' が付いている時だけが「出ている」。popOff() は innerHTML を
         消さないので、中身だけ読むと閉じたポップを読んでしまう。 */
      return (z && z.className.indexOf('on') >= 0)
        ? z.innerText.replace(/\s+/g, ' ').trim() : '';
    });
  }
  async popShut(){
    if (await this.pop()){ await this.tapDo('popNo'); await this.quiet(); }
  }
  async run(fn, arg){ const r = await this.pg.evaluate(fn, arg); await this.quiet(); return r; }
  async offline(on){ await this.pg.evaluate(v => { window.__OFFLINE = v; }, !!on); }
  async close(){ await this.ctx.close(); }
}

function seedLS(kv){
  try { for (const k in kv) localStorage.setItem(k, kv[k]); } catch (e) {}
}

/* ===========================================================================
   三。歩く道
   ======================================================================== */

const WALKS = {};
const say = (s) => console.log(s);

/* ---- 門をくぐる。道1はこれを写真つきで、ほかの道は黙って通る。 -------- */
async function arrive(a, who, shots){
  const pic = (n) => shots ? a.shot(n) : Promise.resolve();
  await pic('ob-open');
  const box = await a.pg.locator('canvas').first().boundingBox();
  if (box){
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await a.pg.mouse.move(cx - 40, cy - 60);
    await a.pg.mouse.down();
    for (let i = 0; i <= 10; i++)
      await a.pg.mouse.move(cx - 40 + i * 8, cy - 60 + i * 12);
    await a.pg.mouse.up();
    await a.quiet();
  }
  await pic('ob-drew');
  await a.tapDo('obDone');

  /* OB_DRAW=0, OB_SNS=1, OB_NAME=2, OB_IN=3, OB_TOUR=4。止まりは 9 つ。 */
  let seen = -1;
  for (let i = 0; i < 60; i++){
    const st = await a.pg.evaluate(() => [ (typeof ob === 'object' && ob) ? ob.step : -1,
                                           typeof obTour === 'number' ? obTour : -1 ]);
    if (st[0] !== 4) break;
    if (st[1] !== seen){ seen = st[1]; await pic('ob-tour-' + (seen + 1)); }
    if (!(await a.tapDo('obTourNext'))) await a.pg.waitForTimeout(600);
    await a.quiet();
  }
  await pic('ob-after-tour');
  if (await a.tapDo('obSnsGo')) await pic('ob-after-sns');

  await a.type('#ob-name', who.lang);
  await pic('ob-name-typed');
  await a.tapDo('obName');
  await pic('ob-after-name');

  await a.tapArg('obMailGo', ['up']);
  await pic('ob-signup');
  await a.type('#ob-em', who.email);
  await pic('ob-signup-typed');
  await a.tapDo('obMailUp');
  await pic('ob-code');
  await a.type('#ob-code', '12345678');
  await a.tapDo('obMailCode');
  await pic('ob-after-code');
  await a.type('#ob-pw', who.pw);
  await a.tapDo('obNewPwGo');
  await pic('ob-after-pw');
  await a.type('#ob-hd', who.handle);
  await a.type('#ob-nm', who.name);
  await pic('ob-who-typed');
  await a.tapDo('obWhoGo');
  await pic('ob-after-who');
  await a.pg.waitForTimeout(2000); await a.quiet();
  return a;
}

/* すでにアカウントがある端末で、門からサインインする。 */
async function signIn(a, who){
  await a.pg.waitForTimeout(200);
  /* まだ歩いていない端末なら、歩かずに門へ出る道を使う。 */
  const at = await a.pg.evaluate(() => appIs());
  if (at === 'ob'){
    await a.tapDo('obSkipAll').catch(() => {});
    await a.pg.evaluate(() => { SET.walked = true; save(); render(); });
    await a.quiet();
  }
  await a.tapArg('obMailGo', ['in']).catch(() => {});
  await a.type('#ob-em', who.email);
  await a.type('#ob-pw', who.pw);
  await a.tapDo('obMailIn');
  await a.pg.waitForTimeout(1500); await a.quiet();
  return a;
}

const AYA  = { email:'aya@example.com',  pw:'hunter22pw', handle:'aya',  name:'アヤ',  lang:'シャンゴ' };
const BENI = { email:'beni@example.com', pw:'hunter33pw', handle:'beni', name:'ベニ', lang:'ロレン' };

/* 画面にある押せるものを並べて見る道具（道を書くときだけ使う） */
WALKS['probe'] = async (br, srv) => {
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  if (process.env.HUNT_PLAN) await a.pg.evaluate(x => planTook(x), process.env.HUNT_PLAN);
  for (const r0 of String(process.env.HUNT_R || 'letters,words,gram,kb,build,feed,me,set').split(',')){
    const t0 = r0.trim(), c = t0.indexOf(':');
    await a.goRoute(c < 0 ? t0 : t0.slice(0, c), c < 0 ? '' : t0.slice(c + 1));
    say('== ' + r0 + ' == ' + (await a.where()));
    (await a.buttons()).forEach(b => say('   ' + b));
  }
  if (process.env.HUNT_PRESS){
    for (const nm of process.env.HUNT_PRESS.split(',')){
      const t = nm.trim().split('|');
      if (t[1]) await a.tapArg(t[0], JSON.parse(t[1])); else await a.tapDo(t[0]);
      await a.pg.waitForTimeout(200);
      say('== after ' + nm + ' == ' + (await a.where()));
      (await a.buttons()).forEach(b => say('   ' + b));
      say('   fields: ' + JSON.stringify(await a.pg.evaluate(() =>
        Array.prototype.map.call(document.querySelectorAll('#app input,#app textarea'),
          e => '#' + (e.id || e.className) + ':' + (e.placeholder || '')))));
    }
  }
  return a;
};

/* ---- 1. 新規：オンボーディングを最初から最後まで ------------------------- */
WALKS['1'] = async (br, srv) => {
  say('--- 1. onboarding, from an empty phone ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, true);
  await a.shot('ob-arrived');
  say('  LANGS: ' + await a.pg.evaluate(() => JSON.stringify(
    Object.keys(LANGS).map(k => ({ id: k.slice(0, 8), name: langNameOf(k),
                                   own: String(langOwnOf(k) || '').slice(0, 8) })))));
  say('  langId=' + await a.pg.evaluate(() => String(langId).slice(0, 8)) +
      '  SET.walked=' + await a.pg.evaluate(() => String(SET.walked)) +
      '  signedIn=' + await a.pg.evaluate(() => String(netSignedIn())) +
      '  appIs=' + await a.pg.evaluate(() => appIs()) +
      '  meRowHas=' + await a.pg.evaluate(() => String(meRowHas())) +
      '  ME.handle=' + await a.pg.evaluate(() => String(ME.handle)));
  await a.reload();
  await a.shot('ob-relaunch');
  say('  server languages: ' + JSON.stringify(srv.db.language.map(l => l.name)));
  KEEP.A = a;
  return a;
};


/* ---- 2. 文字 ------------------------------------------------------------ */
WALKS['2'] = async (br, srv) => {
  say('--- 2. letters ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();

  await a.tapArg('goTab', ['build']);
  await a.shot('lt-contents');
  await a.tapArg('go', ['letters']);
  await a.shot('lt-rooms');
  const rooms = await a.pg.evaluate(() => ltKinds().map(k => k + ':' + ltOfKind(k).length + '/' + ltOfKindIn(LETTERS, k).length));
  say('  rooms as the app counts them: ' + JSON.stringify(rooms));

  await a.tapArg('go', ['ltset', 'alpha']);
  await a.shot('lt-alpha');
  const n1 = await a.pg.evaluate(() => document.querySelectorAll('#app [data-do^="ltGo"]').length);
  say('  alphabet rows on screen: ' + n1 +
      '   LETTERS total: ' + await a.pg.evaluate(() => LETTERS.length));

  /* 一つ開いて描く */
  await a.tapArg('ltGo', ['lt.c']);
  await a.shot('lt-c-open');
  await a.tapArg('editLetter', ['lt.c']);
  await a.shot('lt-c-edit');
  const box = await a.pg.locator('canvas').first().boundingBox();
  if (box){
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await a.pg.mouse.move(cx - 50, cy - 50); await a.pg.mouse.down();
    for (let i = 0; i <= 10; i++) await a.pg.mouse.move(cx - 50 + i * 10, cy + 50 - i * 6);
    await a.pg.mouse.up(); await a.quiet();
  }
  await a.shot('lt-c-drawn');
  await a.tapDo('keepPress');
  await a.shot('lt-c-saved');

  /* 音を選ぶ */
  await a.tapArg('openSnd', ['lt.c']);
  await a.shot('lt-c-snd');
  const first = (await a.buttons()).filter(b => b.indexOf('ltTakeSnd') === 0)[0];
  say('  first sound on the sheet: ' + first);
  if (first) await a.tapDo('ltTakeSnd');
  await a.shot('lt-c-snd-taken');
  await a.tapDo('back');
  await a.shot('lt-after-snd');

  /* 名前を変える ── 無料では出ないはず */
  say('  free: editName on screen? ' +
      (await a.buttons()).some(b => b.indexOf('editName') === 0));
  /* 消す ── 無料では出ないはず */
  say('  free: ltDelete on screen? ' +
      (await a.buttons()).some(b => b.indexOf('ltDelete') === 0));

  /* 無料で「文字の追加」を押すと何が出るか */
  await a.tapDo('back');
  await a.shot('lt-back-to-alpha');
  await a.popShut();
  say('  free: plan=' + await a.pg.evaluate(() => plan()) +
      ' can(letters)=' + await a.pg.evaluate(() => String(can('letters'))));
  const n0 = await a.pg.evaluate(() => LETTERS.length);
  await a.tapArg('newLetter', ['alpha']);
  await a.shot('lt-free-add');
  say('  free: pressed 文字の追加 -> LETTERS ' + n0 + ' -> ' +
      await a.pg.evaluate(() => LETTERS.length) +
      '  where=' + await a.where() + '  pop="' + await a.pop() + '"');
  await a.popShut();

  /* 有料にして、足す・名前を変える・消す */
  srv.db.planIs = 'pro';
  await a.pg.evaluate(() => planTook('pro'));
  await a.quiet();
  await a.popShut();
  await a.goRoute('ltset', 'alpha');
  await a.shot('lt-alpha-pro');
  say('  pro: plan=' + await a.pg.evaluate(() => plan()) +
      ' can(letters)=' + await a.pg.evaluate(() => String(can('letters'))));
  const before = await a.pg.evaluate(() => LETTERS.length);
  say('  pro: pop BEFORE the press = "' + await a.pop() + '"');
  await a.tapArg('newLetter', ['alpha']);
  await a.shot('lt-added');
  say('  pro: pressed 文字の追加 -> LETTERS ' + before + ' -> ' +
      await a.pg.evaluate(() => LETTERS.length) +
      '  where=' + await a.where() + '  pop="' + await a.pop() + '"');
  await a.popShut();

  const last = await a.pg.evaluate(() => LETTERS[LETTERS.length - 1].id);
  await a.goRoute('letter', last);
  await a.shot('lt-new-open');
  say('  new letter page fields: ' + JSON.stringify(await a.buttons()));
  await a.type('#lt-rom', 'ng');
  await a.shot('lt-name-typed');
  await a.tapDo('keepPress');
  await a.shot('lt-saved');
  say('  after 保存: ' + await a.pg.evaluate(x =>
    JSON.stringify(LETTERS.filter(l => l.id === x)
      .map(l => ({ ch: l.ch || '', name: l.name || '', ph: l.ph || '' }))), last) +
    '  where=' + await a.where());

  /* 一覧に何行出ているか */
  await a.goRoute('ltset', 'alpha');
  await a.shot('lt-alpha-after-add');
  say('  alphabet rows now: ' +
      await a.pg.evaluate(() => document.querySelectorAll('#app [data-do^="ltGo"]').length) +
      '  ltOfKind(alpha)=' + await a.pg.evaluate(() => ltOfKind('alpha').length));

  /* 消す */
  await a.goRoute('letter', last);
  await a.tapArg('ltDelete', [last]);
  await a.shot('lt-delete-ask');
  say('  delete pop: "' + await a.pop() + '"');
  await a.tapDo('popYes');
  await a.shot('lt-deleted');
  say('  LETTERS after delete: ' + await a.pg.evaluate(() => LETTERS.length) +
      '  where: ' + await a.where() + '  second pop: "' + await a.pop() + '"');
  /* 消したあとに出てくる二つ目のポップで「はい」を押したらどうなるか */
  if (await a.pop()){
    await a.tapDo('popYes');
    await a.shot('lt-deleted-then-yes');
    say('  after はい on the second pop: LETTERS=' +
        await a.pg.evaluate(() => LETTERS.length) + '  where=' + await a.where());
  }
  await a.reload();
  await a.shot('lt-relaunch');
  say('  langId now: ' + await a.pg.evaluate(() => String(langId).slice(0, 8)) +
      '  LANGS: ' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => k.slice(0, 8) + '=' + langNameOf(k)))));
  say('  server letters slices: ' + JSON.stringify(srv.db.slice
    .filter(x => x.kind === 'letters')
    .map(x => ({ lang: x.language.slice(0, 8), n: (() => { try { return JSON.parse(x.body).length; } catch (e) { return '?'; } })() }))));
  say('  slice writes, in order:\n    ' +
      (srv.db.sliceLog || []).filter(x => x.indexOf('letters') > 0).join('\n    '));
  say('  LETTERS after relaunch: ' + await a.pg.evaluate(() => LETTERS.length) +
      '  server letters slice: ' + (srv.db.slice.filter(x => x.kind === 'letters')
        .map(x => { try { return JSON.parse(x.body).length; } catch (e) { return '?'; } }).join(',')));
  return a;
};

/* 章の「例文」の ＋ だけを、前に何も押さずに確かめる */
WALKS['4b'] = async (br, srv) => {
  say('--- 4b. just the ＋ beside 例文 on a chapter page ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  await a.tapArg('goTab', ['build']);
  await a.tapArg('go', ['gram']);
  await a.tapArg('go', ['gram', 'v2:pst']);
  await a.pg.waitForTimeout(2500);
  await a.shot('grb-before');
  say('  before: where=' + await a.where() + '  toast="' +
      await a.pg.evaluate(() => { const t = document.getElementById('toast');
        return (t && t.className.indexOf('on') >= 0) ? t.textContent : ''; }) + '"');
  const html0 = await a.pg.evaluate(() => document.getElementById('app').innerHTML.length);
  await a.tapArg('stExOpen', ['pst']);
  await a.pg.waitForTimeout(600);
  await a.shot('grb-after');
  say('  after pressing ＋: where=' + await a.where() +
      '  toast="' + await a.pg.evaluate(() => { const t = document.getElementById('toast');
        return (t && t.className.indexOf('on') >= 0) ? t.textContent : ''; }) + '"' +
      '  pop="' + await a.pop() + '"' +
      '  #app html ' + html0 + ' -> ' +
      await a.pg.evaluate(() => document.getElementById('app').innerHTML.length));
  return a;
};

/* ---- 3. 辞書 ------------------------------------------------------------ */
WALKS['3'] = async (br, srv) => {
  say('--- 3. dictionary ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  await a.tapArg('goTab', ['build']);
  await a.tapArg('go', ['words']);
  await a.shot('wd-empty');

  const TEN = [['kano','山'],['sar','川'],['tir','見る'],['mos','高い'],['lom','落ちる'],
               ['nak','ない'],['ke','なに'],['tira','見た'],['sela','海'],['toren','木']];
  for (let i = 0; i < TEN.length; i++){
    await a.goRoute('words');
    await a.tapDo('openAdd');
    await a.type('#wd-ln', TEN[i][0]);
    await a.type('#wd-mn', TEN[i][1]);
    if (i === 0) await a.shot('wd-add-typed');
    await a.tapDo('addOne');
    if (i === 0) await a.shot('wd-add-1');
  }
  await a.settle();
  await a.shot('wd-ten');
  say('  WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  rows on screen=' + await a.pg.evaluate(() =>
        document.querySelectorAll('#app [data-do^="openWord"]').length) +
      '  where=' + await a.where());

  /* 同じ綴りをもう一度 */
  await a.goRoute('words');
  await a.tapDo('openAdd');
  await a.type('#wd-ln', 'kano');
  await a.type('#wd-mn', '髪');
  await a.tapDo('addOne');
  await a.shot('wd-dup');
  say('  after adding kano twice: WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  kano rows=' + await a.pg.evaluate(() =>
        WORDS.filter(w => w.hw === 'kano').length) +
      '  pop="' + await a.pop() + '"  where=' + await a.where());
  await a.popShut();

  /* 検索 */
  await a.goRoute('words');
  await a.shot('wd-list');
  await a.type('#w-q', 'ka');
  await a.shot('wd-search-ka');
  say('  search "ka": rows=' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app [data-do^="openWord"]').length));
  await a.tapArg('clearSearch', ['w', 'wordsSetQ']);
  await a.shot('wd-search-cleared');
  say('  after clearing: rows=' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app [data-do^="openWord"]').length));

  /* 並べ替え */
  await a.tapDo('openSort');
  await a.shot('wd-sort-sheet');
  say('  sort sheet: ' + JSON.stringify((await a.buttons()).slice(0, 12)));
  await a.tapDo('back');
  await a.shot('wd-after-sort');

  /* 直す ── 綴りを変えて保存 */
  await a.goRoute('words');
  await a.tapArg('openWord', ['sar']);
  await a.shot('wd-open-sar');
  say('  word page: ' + JSON.stringify(await a.buttons()));
  await a.tapDo('openEdit');
  await a.shot('wd-edit-sar');
  say('  edit sheet fields: ' + JSON.stringify(await a.pg.evaluate(() =>
    Array.prototype.map.call(document.querySelectorAll('#app input,#app textarea'),
      e => '#' + (e.id || e.className)))));
  await a.type('#wd-ln', 'saru');
  await a.tapDo('keepPress');
  await a.shot('wd-renamed');
  say('  after rename sar->saru: where=' + await a.where() +
      '  WORDS has sar? ' + await a.pg.evaluate(() => String(!!findWord('sar'))) +
      '  saru? ' + await a.pg.evaluate(() => String(!!findWord('saru'))));

  /* 消す */
  await a.goRoute('words');
  await a.tapArg('openWord', ['mos']);
  await a.shot('wd-open-mos');
  await a.tapArg('openEdit', ['mos']);
  await a.shot('wd-edit-mos');
  await a.tapDo('delWord');
  await a.shot('wd-del-ask');
  say('  delete pop: "' + await a.pop() + '"');
  await a.tapDo('popYes');
  await a.shot('wd-deleted');
  say('  after delete: WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  where=' + await a.where() + '  pop="' + await a.pop() + '"');
  await a.popShut();
  await a.reload();
  await a.tapArg('goTab', ['build']);
  await a.tapArg('go', ['words']);
  await a.shot('wd-relaunch');
  say('  after relaunch: WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  rows=' + await a.pg.evaluate(() =>
        document.querySelectorAll('#app [data-do^="openWord"]').length));
  return a;
};

/* ---- 4. 文法 ------------------------------------------------------------ */
WALKS['4'] = async (br, srv) => {
  say('--- 4. grammar ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  await a.tapArg('goTab', ['build']);
  await a.tapArg('go', ['gram']);
  await a.shot('gr-contents');
  const rows = await a.buttons();
  say('  stages on the contents: ' + rows.filter(b => /^(go\["gram"|stOpen)/.test(b)).length);

  /* 1 語順 ── 札を並べて保存 */
  await a.tapArg('go', ['gram', 'v2:order']);
  await a.shot('gr-order');
  for (const k of ['S', 'O', 'V']) await a.tapArg('g2Put', [k]);
  await a.shot('gr-order-put');
  say('  after S O V: buffer=' + await a.pg.evaluate(() => JSON.stringify(g2Seq())) +
      '  STG.order=' + await a.pg.evaluate(() => JSON.stringify(STG.order || null)));
  await a.tapDo('keepPress');
  await a.shot('gr-order-saved');
  say('  where after 保存: ' + await a.where() +
      '  STG.order=' + await a.pg.evaluate(() => JSON.stringify(STG.order || null)));

  /* 例文 */
  await a.tapArg('go', ['gram', 'v2:order']);
  say('  an unanswered row (np) class: ' + await a.pg.evaluate(() => {
    const e = document.querySelector('#app [data-a*="v2:np"]');
    return e ? e.className : '(none)';
  }));
  const hit = await a.tapArg('stExOpen', ['order']);
  say('  pressed the ＋ beside 例文? ' + hit + '  -> where=' + await a.where());
  await a.shot('gr-ex-form');
  say('  example fields: ' + JSON.stringify(await a.pg.evaluate(() =>
    Array.prototype.map.call(document.querySelectorAll('#app input,#app textarea'),
      e => '#' + (e.id || e.className)))));
  const f = await a.pg.evaluate(() => {
    const e = document.querySelectorAll('#app input,#app textarea');
    return e.length ? '#' + (e[0].id || e[0].className) : '';
  });
  if (f){ await a.type(f, 'kano tir sar'); await a.shot('gr-ex-typed'); }
  await a.tapDo('keepPress');
  await a.shot('gr-ex-saved');

  /* 戻る、そして目次の 1 行目が何と言っているか */
  await a.tapDo('back');
  await a.shot('gr-back');
  say('  where after back: ' + await a.where());
  await a.goRoute('gram');
  await a.shot('gr-contents-after');
  say('  row 1 class now: ' + await a.pg.evaluate(() => {
    const e = document.querySelector('#app [data-a*="v2:order"]');
    return e ? e.className + '  |text| ' + e.innerText.replace(/\s+/g, ' ') : '(none)';
  }));

  /* もう一度、まっさらな章で ＋ を押す（前の保存の影響を外すため） */
  await a.goRoute('gram');
  await a.tapArg('go', ['gram', 'v2:pst']);
  await a.shot('gr-pst');
  const hit2 = await a.tapArg('stExOpen', ['pst']);
  await a.shot('gr-pst-plus');
  say('  ＋ on a fresh chapter (過去形): pressed=' + hit2 + '  where=' + await a.where() +
      '  fields=' + JSON.stringify(await a.pg.evaluate(() =>
        Array.prototype.map.call(document.querySelectorAll('#app input,#app textarea'),
          e => '#' + (e.id || e.className)))) +
      '  pop="' + await a.pop() + '"');

  /* そして「段」の側（4 接続詞）の ＋ はどうか */
  await a.goRoute('gram');
  await a.tapArg('stOpen', ['conj']);
  await a.shot('gr-conj');
  say('  段 4 接続詞: where=' + await a.where() +
      '  buttons=' + JSON.stringify((await a.buttons()).slice(0, 10)));
  const hit3 = await a.tapArg('openStEx', ['conj']) || await a.tapArg('stExOpen', ['conj']);
  await a.shot('gr-conj-plus');
  say('  段の例文を開く: pressed=' + hit3 + '  where=' + await a.where() +
      '  buttons=' + JSON.stringify(await a.buttons()));
  await a.tapArg('stExOpen', ['conj']);
  await a.shot('gr-conj-ex-new');
  say('  段の例文で ＋: fields=' + JSON.stringify(await a.pg.evaluate(() =>
        Array.prototype.map.call(document.querySelectorAll('#app input,#app textarea'),
          e => '#' + (e.id || e.className)))));
  await a.type('#sx-ln', 'kano tir');
  await a.type('#sx-gl', '山を見る');
  await a.shot('gr-conj-ex-typed');
  /* まず「保存」だけ押したらどうなるか（打った三つの箱のまま） */
  await a.tapDo('keepPress');
  await a.shot('gr-conj-ex-saved-no-enter');
  say('  typed the three boxes, pressed 保存 only: where=' + await a.where() +
      '  examples kept=' + await a.pg.evaluate(() => stExKept('conj').length));
  /* 次に Enter を踏んでから保存（こちらが仕様の道） */
  await a.tapArg('openStEx', ['conj']);
  await a.tapArg('stExOpen', ['conj']);
  await a.type('#sx-ln', 'kano tir');
  await a.type('#sx-gl', '山を見る');
  await a.pg.locator('#sx-gl').press('Enter');
  await a.quiet();
  await a.shot('gr-conj-ex-enter');
  say('  after Enter: rows on the page=' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app .exlist .exrow, #app .exlist > *').length));
  await a.tapDo('keepPress');
  await a.shot('gr-conj-ex-saved');
  say('  after Enter then 保存: where=' + await a.where() +
      '  examples kept=' + await a.pg.evaluate(() => stExKept('conj').length));

  await a.reload();
  await a.tapArg('goTab', ['build']);
  await a.tapArg('go', ['gram']);
  await a.shot('gr-relaunch');
  say('  after relaunch, row 1: ' + await a.pg.evaluate(() => {
    const e = document.querySelector('#app [data-a*="v2:order"]');
    return e ? e.className + '  |text| ' + e.innerText.replace(/\s+/g, ' ') : '(none)';
  }) +
    '  STG.order=' + await a.pg.evaluate(() => JSON.stringify(STG.order || null)));
  return a;
};

/* ---- 5. キーボード ------------------------------------------------------- */
WALKS['5'] = async (br, srv) => {
  say('--- 5. keyboard ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  srv.db.planIs = 'pro';
  await a.pg.evaluate(() => planTook('pro'));
  await a.quiet(); await a.popShut();

  const rowsNow = () => a.pg.evaluate(() => {
    const b = kbBoards();
    return JSON.stringify(b.map(x => (x.lay || []).map(l =>
      (l.r || l.rows || l || []).map(r => (r || []).length))));
  });
  const keysOf = (i, lay) => a.pg.evaluate(x => {
    const b = kbBoards()[x[0]];
    const l = (b.lay || [])[x[1]];
    const rows = l.r || l.rows || l || [];
    return JSON.stringify(rows.map(r => (r || []).map(k =>
      (k && (k.k || k.lt || k.ch || k.t)) || '·').join(' ')));
  }, [i, lay]);

  await a.tapArg('goTab', ['build']);
  await a.tapArg('go', ['kb']);
  await a.shot('kb-list');
  say('  boards: ' + JSON.stringify((await a.buttons()).filter(b => /kbGoBoard|kbNew/.test(b))));
  say('  layouts: ' + await rowsNow());

  await a.tapDo('kbNew');
  await a.shot('kb-new');
  say('  after 追加: where=' + await a.where() +
      '  patterns=' + JSON.stringify((await a.buttons()).filter(b => b.indexOf('kbAdd') === 0)));
  /* 五つの型を全部作って、キーに何が乗るかを見る */
  for (const pat of ['qwerty', 'flick', 'tap', 'chart', 'abc']){
    const n = await a.pg.evaluate(() => kbBoards().length);
    if (n > 1){ await a.goRoute('kb'); await a.tapDo('kbNew'); }
    await a.tapArg('kbAdd', [pat]);
    await a.shot('kb-made-' + pat);
    say('  型「' + pat + '」で作った板 ' + n + ': ' +
      await a.pg.evaluate(x => {
        const b = kbBoards()[x]; if (!b) return '(none)';
        const rows = b.lay[0].rows || b.lay[0];
        return JSON.stringify(rows.map(r => r.map(k =>
          k.k === 'lt' ? (k.t || '·') : ('[' + k.k + ']')).join(' ')));
      }, n));
  }
  await a.goRoute('kb', '1');
  await a.shot('kb-made');
  say('  after choosing QWERTY: where=' + await a.where() +
      '  layouts=' + await rowsNow());

  say('  board 0 (free QWERTY) keys: ' + await keysOf(0, 0));
  say('  board 1 (just made)  keys: ' + await keysOf(1, 0));
  say('  board 0 shape: ' + await a.pg.evaluate(() => {
    const b = kbBoards()[0]; const l = b.lay[0];
    return Object.keys(l).join(',') + ' || row1=' + JSON.stringify((l.r||l.rows||l)[1]).slice(0, 260); }));
  say('  board 1 shape: ' + await a.pg.evaluate(() => {
    const b = kbBoards()[1]; const l = b.lay[0];
    return Object.keys(l).join(',') + ' || row1=' + JSON.stringify((l.r||l.rows||l)[1]).slice(0, 260); }));
  await a.shot('kb-editor');
  say('  editor buttons: ' + JSON.stringify((await a.buttons()).slice(0, 30)));
  const was = await rowsNow();

  /* 列の頭を押して選び、ゴミ箱で消す */
  await a.tapArg('kbHeadCol', [2]);
  await a.shot('kb-col-picked');
  say('  after picking column 2: buttons=' +
      JSON.stringify((await a.buttons()).filter(b => /kbCut|kbAlign|kbJoinSel|kbOpenSel/.test(b))));
  await a.tapDo('kbCut');
  await a.shot('kb-col-cut');
  say('  layouts after 削除: ' + await rowsNow());
  await a.tapDo('kbUndo');
  await a.shot('kb-undone');
  say('  layouts after 戻す:  ' + await rowsNow() + '\n   (before it all: ' + was + ')');
  await a.tapDo('kbRedo');
  await a.shot('kb-redone');
  say('  layouts after やり直し: ' + await rowsNow());
  await a.tapDo('kbUndo');
  await a.quiet();

  /* 二つ目の面 */
  await a.tapDo('kbAddLay');
  await a.shot('kb-layer2');
  say('  after 面を追加: where=' + await a.where() + '  layouts=' + await rowsNow() +
      '  layer buttons=' + JSON.stringify((await a.buttons()).filter(b => /kbGoLay|kbDropLay/.test(b))));

  await a.tapDo('keepPress');
  await a.shot('kb-saved');
  say('  after 保存: where=' + await a.where());
  await a.reload();
  await a.tapArg('goTab', ['build']);
  await a.tapArg('go', ['kb']);
  await a.shot('kb-relaunch');
  say('  boards after relaunch: ' +
      JSON.stringify((await a.buttons()).filter(b => b.indexOf('kbGoBoard') === 0)) +
      '\n   layouts: ' + await rowsNow());
  return a;
};

/* ---- 6. 投稿 ------------------------------------------------------------ */
WALKS['6'] = async (br, srv) => {
  say('--- 6. posting ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  await a.tapArg('goTab', ['feed']);
  await a.shot('ps-feed-empty');

  await a.tapDo('openPost');
  await a.shot('ps-composer');
  await a.type('#pw-ln', 'kano tir sar');
  await a.type('#pw-mn', '山から川を見た');
  await a.shot('ps-typed');

  /* 写真 ── ライブラリの file 欄に一枚入れる */
  const jpg = path.join(SHOTS, '_a-photo.png');
  fs.writeFileSync(jpg, FAKE_PIC);
  const fin = a.pg.locator('#pw-cam');
  if (await fin.count()){
    await fin.setInputFiles(jpg).catch(e => say('    ! photo: ' + e.message.split('\n')[0]));
    await a.quiet(400);
  }
  await a.shot('ps-photo');
  say('  after putting a photograph in: pics on the composer=' +
      await a.pg.evaluate(() => document.querySelectorAll('#app .pwpic, #app [data-do^="pwDropPic"]').length));

  /* 声 */
  await a.tapDo('voStart');
  await a.pg.waitForTimeout(1200);
  await a.shot('ps-voice-on');
  await a.tapDo('voStop');
  await a.quiet(500);
  await a.shot('ps-voice-off');
  say('  after 声: buttons=' + JSON.stringify((await a.buttons()).filter(b => /vo/.test(b))));
  await a.tapDo('pwSend');
  await a.settle();
  await a.shot('ps-sent');
  say('  after 投稿する: where=' + await a.where() +
      '  posts on server=' + srv.db.post.length);

  await a.tapArg('goTab', ['feed']);
  await a.shot('ps-feed');
  say('  rows on the timeline: ' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app [data-do^="postOpen"]').length));

  /* 開いて、いいね、返信 */
  say('  feed buttons: ' + JSON.stringify((await a.buttons()).slice(0, 12)));
  const pid = await a.pg.evaluate(() => {
    const e = document.querySelector('#app [data-do="postOpen"]');
    try { return JSON.parse(e.getAttribute('data-a'))[0]; } catch (x) { return ''; }
  });
  say('  id on the screen: ' + pid + '   id on the server: ' +
      (srv.db.post[0] ? srv.db.post[0].id : '(none)'));
  /* 行の左上を押す ── 真ん中は写真で、写真には写真の押し方がある */
  await a.tapArg('postOpen', [pid], { x: 300, y: 40 });
  await a.shot('ps-thread');
  say('  post page: ' + JSON.stringify((await a.buttons()).slice(0, 14)));
  await a.tapArg('postLike', [pid]);
  await a.settle();
  await a.shot('ps-liked');
  say('  likes on server: ' + srv.db.react.length +
      '  i_like on screen? ' + await a.pg.evaluate(() =>
        !!document.querySelector('#app .on[data-do^="postLike"], #app [data-do^="postLike"].on')));

  await a.tapArg('postReply', [pid]);
  await a.shot('ps-reply-form');
  await a.type('#pw-ln', 'mos');
  await a.type('#pw-mn', 'たかい');
  await a.tapDo('pwSend');
  await a.settle();
  await a.shot('ps-replied');
  say('  posts on server after the reply: ' + srv.db.post.length +
      '  replies: ' + srv.db.post.filter(p => p.reply_to).length);

  await a.tapArg('goTab', ['feed']);
  await a.shot('ps-feed-2');
  say('  timeline rows now: ' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app [data-do^="postOpen"]').length));

  /* 消す */
  await a.tapArg('postOpen', [pid], { x: 300, y: 40 });
  await a.tapArg('postMore', [pid]);
  await a.shot('ps-more');
  say('  more sheet: ' + JSON.stringify((await a.buttons()).filter(b => /postDel|postPin|postEdit/.test(b))));
  await a.tapArg('postDel', [pid]);
  await a.shot('ps-del-ask');
  say('  delete pop: "' + await a.pop() + '"');
  await a.tapDo('popYes');
  await a.settle();
  await a.shot('ps-deleted');
  say('  after delete: where=' + await a.where() + '  posts on server=' + srv.db.post.length);
  await a.reload();
  await a.tapArg('goTab', ['feed']);
  await a.shot('ps-relaunch');
  say('  timeline after relaunch: ' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app [data-do^="postOpen"]').length) + ' rows');
  return a;
};

/* ---- 7. プロフィール ------------------------------------------------------ */
WALKS['7'] = async (br, srv) => {
  say('--- 7. profile ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  await a.tapArg('goTab', ['profile']);
  await a.shot('pf-mine');
  await a.tapDo('openMe');
  await a.shot('pf-edit');
  say('  edit fields: ' + JSON.stringify(await a.pg.evaluate(() =>
    Array.prototype.map.call(document.querySelectorAll('#app input,#app textarea'),
      e => '#' + (e.id || e.className) + ':' + (e.placeholder || '')))));
  const ids = await a.pg.evaluate(() =>
    Array.prototype.map.call(document.querySelectorAll('#app input,#app textarea'),
      e => e.id).filter(Boolean));
  const put = { 'me-nm': 'アヤ改', 'me-hd': 'ayaka', 'me-bio': '言語をつくっています',
                'me-lk': 'https://example.com', 'me-lc': '東京' };
  for (const k of ids) if (put[k]) await a.type('#' + k, put[k]);
  await a.shot('pf-typed');
  await a.tapDo('keepPress');
  await a.settle();
  await a.shot('pf-saved');
  say('  after 保存: where=' + await a.where() +
      '\n   ME: ' + await a.pg.evaluate(() => JSON.stringify(
        { nm: ME.name, hd: ME.handle, bio: ME.bio, link: ME.link, loc: ME.loc })) +
      '\n   server profile: ' + JSON.stringify(srv.db.profile.map(x =>
        ({ h: x.handle, d: x.display, bio: x.bio, link: x.link, loc: x.loc }))));
  await a.reload();
  await a.tapArg('goTab', ['profile']);
  await a.shot('pf-relaunch');
  say('  after relaunch: ' + await a.pg.evaluate(() => JSON.stringify(
    { nm: ME.name, hd: ME.handle, bio: ME.bio })));
  return a;
};

/* ---- 8. 検索・通知・保存した検索 ------------------------------------------- */
WALKS['8'] = async (br, srv) => {
  say('--- 8. search and notices ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  /* 何か一つ書いておく */
  await a.tapArg('goTab', ['feed']);
  await a.tapDo('openPost');
  await a.type('#pw-ln', 'kano');
  await a.type('#pw-mn', 'やま');
  await a.tapDo('pwSend');
  await a.settle();

  await a.tapArg('goTab', ['explore']);
  await a.shot('se-explore');
  say('  explore buttons: ' + JSON.stringify((await a.buttons()).slice(0, 12)));
  const q = '#sns-q';
  say('  search field: ' + q);
  if (q){
    await a.type(q, 'kano');
    await a.pg.locator(q).press('Enter');
    await a.quiet(600);
  }
  await a.shot('se-searched');
  say('  after searching "kano": where=' + await a.where() +
      '  rows=' + await a.pg.evaluate(() =>
        document.querySelectorAll('#app [data-do^="postOpen"]').length) +
      '  recent on server=' + srv.db.recent_search.length);
  await a.tapDo('snsSaveQ');
  await a.settle();
  await a.shot('se-saved');
  say('  after ★: saved on server=' + srv.db.saved_search.length +
      '  buttons=' + JSON.stringify((await a.buttons()).filter(b => /snsSaveQ|snsPick|snsDrop/.test(b))));
  await a.tapDo('snsClearQ');
  await a.shot('se-cleared');
  say('  after clearing: ' + JSON.stringify((await a.buttons()).filter(b => /snsPick/.test(b))));

  await a.tapArg('goTab', ['notif']);
  await a.shot('se-notif');
  say('  notices: ' + JSON.stringify((await a.buttons()).slice(0, 10)) +
      '  text=' + JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 6)));
  await a.reload();
  await a.tapArg('goTab', ['explore']);
  await a.shot('se-relaunch');
  say('  saved searches after relaunch: ' +
      JSON.stringify((await a.buttons()).filter(b => /snsPick/.test(b))));
  say('  saved_search requests the app made: ' + JSON.stringify(
    srv.db.log.filter(l => l.p.indexOf('saved_search') >= 0).map(l => l.m)));
  say('  saved_search rows the server holds: ' + JSON.stringify(srv.db.saved_search));
  say('  what netSearchSaved answers now: ' + await a.pg.evaluate(() =>
    new Promise(r => netSearchSaved(d => r(JSON.stringify(d)), () => r('(bad)')))));
  return a;
};

/* ---- 9. 設定 -------------------------------------------------------------- */
WALKS['9'] = async (br, srv) => {
  say('--- 9. settings ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  await a.tapArg('goTab', ['profile']);
  await a.tapArg('go', ['settings']);
  await a.shot('st-settings');
  say('  settings rows: ' + JSON.stringify(await a.buttons()));

  await a.tapArg('go', ['set', 'look']);
  await a.shot('st-look');
  say('  look room: ' + JSON.stringify(await a.buttons()));
  await a.tapArg('setTheme', ['dark']);
  await a.shot('st-dark');
  say('  theme now: ' + await a.pg.evaluate(() => SET.theme) +
      '  root: ' + await a.pg.evaluate(() =>
        document.documentElement.getAttribute('data-theme') || '(none)'));
  await a.tapArg('setTheme', ['light']);
  await a.shot('st-light');
  await a.tapDo('back');

  await a.tapArg('go', ['set', 'ui']);
  await a.shot('st-ui-room');
  say('  ui room: ' + JSON.stringify((await a.buttons()).slice(0, 12)));
  await a.tapArg('setUi', ['en']);
  await a.quiet(300);
  await a.shot('st-english');
  say('  ui now: ' + await a.pg.evaluate(() => SET.ui) +
      '  heading: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 4)));
  await a.tapArg('setUi', ['ja']);
  await a.quiet(300);
  await a.shot('st-japanese');
  await a.tapDo('back');

  await a.tapArg('go', ['plans']);
  await a.shot('st-plans');
  say('  plans page: ' + JSON.stringify(await a.buttons()));
  await a.tapDo('back');
  await a.shot('st-back');
  say('  where after back: ' + await a.where());
  await a.reload();
  await a.tapArg('goTab', ['profile']);
  await a.tapArg('go', ['settings']);
  await a.shot('st-relaunch');
  say('  after relaunch: theme=' + await a.pg.evaluate(() => SET.theme) +
      ' ui=' + JSON.stringify(await a.pg.evaluate(() => SET.ui)) +
      '  rows=' + JSON.stringify((await a.buttons()).filter(b => /set","(look|ui)/.test(b))));
  return a;
};

/* ---- 10. 二台 ------------------------------------------------------------ */
WALKS['10'] = async (br, srv) => {
  say('--- 10. two handsets, one account ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  /* A で語を三つ */
  for (const w of [['kano', '山'], ['sar', '川'], ['tir', '見る']]){
    await a.goRoute('words');
    await a.tapDo('openAdd');
    await a.type('#wd-ln', w[0]); await a.type('#wd-mn', w[1]);
    await a.tapDo('addOne');
  }
  await a.settle();
  await a.goRoute('words');
  await a.shot('two-A-words');
  say('  A: WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  server words slices=' + JSON.stringify(srv.db.slice.filter(x => x.kind === 'words')
        .map(x => { try { return JSON.parse(x.body).length; } catch (e) { return '?'; } })));

  /* B は同じアカウントでサインイン */
  const b = await new Dev(br, srv, 'B').open();
  await signIn(b, AYA);
  await b.shot('two-B-arrived');
  say('  B: appIs=' + await b.pg.evaluate(() => appIs()) +
      '  LANGS=' + await b.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => k.slice(0, 8) + '=' + langNameOf(k)))));
  await b.goRoute('words');
  await b.shot('two-B-words');
  say('  B: WORDS=' + await b.pg.evaluate(() => WORDS.length) +
      '  rows=' + await b.pg.evaluate(() =>
        document.querySelectorAll('#app [data-do^="openWord"]').length));

  /* B で一語足す */
  await b.goRoute('words');
  await b.tapDo('openAdd');
  await b.type('#wd-ln', 'mos'); await b.type('#wd-mn', '高い');
  await b.tapDo('addOne');
  await b.settle();
  await b.goRoute('words');
  await b.shot('two-B-added');
  say('  B after adding mos: WORDS=' + await b.pg.evaluate(() => WORDS.length));

  /* A を読み込み直す ── B の語が来るか、A の語が消えないか */
  await a.reload();
  await a.goRoute('words');
  await a.shot('two-A-after-B');
  say('  A after reloading: WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  list=' + await a.pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw))));

  /* 両方で同時に書く */
  await a.goRoute('words');
  await a.tapDo('openAdd'); await a.type('#wd-ln', 'aaa'); await a.type('#wd-mn', 'A から');
  await b.goRoute('words');
  await b.tapDo('openAdd'); await b.type('#wd-ln', 'bbb'); await b.type('#wd-mn', 'B から');
  await a.tapDo('addOne'); await b.tapDo('addOne');
  await a.settle(); await b.settle();
  await a.reload(); await b.reload();
  await a.goRoute('words'); await b.goRoute('words');
  await a.shot('two-A-final'); await b.shot('two-B-final');
  say('  A finally: ' + await a.pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw))));
  say('  B finally: ' + await b.pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw))));
  say('  server words slices: ' + JSON.stringify(srv.db.slice.filter(x => x.kind === 'words')
    .map(x => { try { return JSON.parse(x.body).map(w => w.hw); } catch (e) { return '?'; } })));
  say('  server languages: ' + JSON.stringify(srv.db.language.map(l =>
    ({ id: l.id.slice(0, 8), name: l.name }))));
  /* 言語を切り替える画面に何行出るか ── 「二つのデータが出る」はここに出る */
  await a.goRoute('settings');
  await a.tapArg('go', ['set', 'lang']);
  await a.shot('two-A-langroom');
  say('  A の「自分の言語」の部屋: ' + JSON.stringify(await a.buttons()));
  await a.tapArg('go', ['langs']);
  await a.shot('two-A-langs');
  say('  A の「言語」の一覧: ' + JSON.stringify(await a.buttons()) +
      '\n   画面の字: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean)));
  /* 有料にすると、隠れていたものが出てくる */
  srv.db.planIs = 'pro';
  await a.pg.evaluate(() => planTook('pro'));
  await a.quiet(); await a.popShut();
  await a.goRoute('langs');
  await a.shot('two-A-langs-pro');
  say('  有料にしたあとの「言語」の一覧: ' +
      JSON.stringify((await a.text()).split('\n').filter(Boolean)));
  say('  A の LANGS: ' + await a.pg.evaluate(() => JSON.stringify(
    Object.keys(LANGS).map(k => k.slice(0, 8) + '="' + langNameOf(k) + '"'))));
  await b.goRoute('settings');
  await b.tapArg('go', ['set', 'lang']);
  await b.shot('two-B-langroom');
  say('  B の「自分の言語」の部屋: ' + JSON.stringify(await b.buttons()));
  await b.close();
  return a;
};

/* ---- 11. 二アカウント ----------------------------------------------------- */
WALKS['11'] = async (br, srv) => {
  say('--- 11. two accounts on one handset ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  /* アヤの持ち物をいくつか作る */
  await a.goRoute('words');
  await a.tapDo('openAdd');
  await a.type('#wd-ln', 'kano'); await a.type('#wd-mn', '山');
  await a.tapDo('addOne');
  await a.tapArg('goTab', ['explore']);
  await a.type('#sns-q', 'kano');
  await a.pg.locator('#sns-q').press('Enter');
  await a.quiet(400);
  await a.tapArg('goTab', ['feed']);
  await a.tapDo('openPost');
  await a.type('#pw-ln', 'kano'); await a.type('#pw-mn', 'やま');
  await a.tapDo('draftKeep');
  await a.settle();
  await a.shot('acc-A-set-up');
  say('  A: words=' + await a.pg.evaluate(() => WORDS.length) +
      ' langs=' + await a.pg.evaluate(() => Object.keys(LANGS).length) +
      ' recents=' + await a.pg.evaluate(() => JSON.stringify((SET.recent || []))) +
      ' drafts on server=' + srv.db.draft.length);

  /* ログアウト */
  await a.goRoute('set', 'acct');
  await a.shot('acc-account-room');
  say('  account room: ' + JSON.stringify(await a.buttons()));
  await a.tapDo('setSignOut');
  await a.shot('acc-signout-ask');
  say('  sign out pop: "' + await a.pop() + '"');
  await a.tapDo('popYes');
  await a.quiet(800);
  await a.shot('acc-signed-out');
  say('  after signing out: appIs=' + await a.pg.evaluate(() => appIs()) +
      '  where=' + await a.where());

  /* ベニで新しくアカウントを作る */
  await a.tapArg('obMailGo', ['up']);
  await a.type('#ob-em', BENI.email);
  await a.tapDo('obMailUp');
  await a.type('#ob-code', '12345678');
  await a.tapDo('obMailCode');
  await a.type('#ob-pw', BENI.pw);
  await a.tapDo('obNewPwGo');
  await a.type('#ob-hd', BENI.handle);
  await a.type('#ob-nm', BENI.name);
  await a.tapDo('obWhoGo');
  await a.pg.waitForTimeout(2000); await a.quiet();
  await a.reload();
  await a.shot('acc-B-arrived');
  say('  as beni: handle=' + await a.pg.evaluate(() => String(ME.handle)) +
      '  words=' + await a.pg.evaluate(() => WORDS.length) +
      '  langs=' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => langNameOf(k)))) +
      '  recents=' + await a.pg.evaluate(() => JSON.stringify(SET.recent || [])));
  await a.goRoute('words');
  await a.shot('acc-B-words');
  await a.tapArg('goTab', ['explore']);
  await a.shot('acc-B-search');
  say('  beni sees on the search screen: ' +
      JSON.stringify((await a.buttons()).filter(b => /snsPick/.test(b))));
  await a.tapArg('goTab', ['feed']);
  await a.tapDo('openPost');
  await a.tapArg('go', ['drafts']);
  await a.shot('acc-B-drafts');
  say('  beni sees drafts: ' + JSON.stringify((await a.buttons()).filter(b => /draftOpen/.test(b))));
  await a.goRoute('langs');
  await a.shot('acc-B-langs');
  say('  beni の言語一覧: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean)) +
      '\n   rows: ' + JSON.stringify((await a.buttons()).filter(b => /langOpen/.test(b))));

  /* アヤに戻る */
  await a.goRoute('set', 'acct');
  await a.tapDo('setSignOut');
  await a.tapDo('popYes');
  await a.quiet(800);
  await signIn(a, AYA);
  await a.reload();
  await a.shot('acc-back-to-A');
  say('  back as aya: handle=' + await a.pg.evaluate(() => String(ME.handle)) +
      '  words=' + await a.pg.evaluate(() => WORDS.length) +
      '  langs=' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => langNameOf(k)))) +
      '  recents=' + await a.pg.evaluate(() => JSON.stringify(SET.recent || [])));
  await a.goRoute('words');
  await a.shot('acc-back-words');
  say('  aya word rows: ' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app [data-do^="openWord"]').length) +
    '  langId=' + await a.pg.evaluate(() => String(langId).slice(0, 8)) +
    ' (' + await a.pg.evaluate(() => langNameOf(langId)) + ')');
  say('  server languages: ' + JSON.stringify(srv.db.language.map(l =>
    ({ id: l.id.slice(0, 8), name: l.name, owner: l.owner.slice(0, 8) }))));
  say('  server words slices: ' + JSON.stringify(srv.db.slice
    .filter(x => x.kind === 'words').map(x => ({ lang: x.language.slice(0, 8),
      n: (() => { try { return JSON.parse(x.body).length; } catch (e) { return '?'; } })() }))));
  say('  server drafts: ' + JSON.stringify(srv.db.draft.map(d => d.author.slice(0, 8))));
  say('  server recent_search: ' + JSON.stringify(srv.db.recent_search.map(r =>
    ({ q: r.q, author: r.author.slice(0, 8) }))));
  say('  uids: aya=' + JSON.stringify(srv.db.users.map(u =>
    ({ e: u.email, id: u.id.slice(0, 8) }))));
  await a.goRoute('langs');
  await a.shot('acc-back-langs');
  say('  aya の言語一覧: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean)));
  return a;
};

/* ---- 12. 言語を二つ ------------------------------------------------------- */
WALKS['12'] = async (br, srv) => {
  say('--- 12. two languages ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  srv.db.planIs = 'pro';
  await a.pg.evaluate(() => planTook('pro'));
  await a.quiet(); await a.popShut();

  /* 一本目に語を入れる */
  await a.goRoute('words');
  await a.tapDo('openAdd');
  await a.type('#wd-ln', 'kano'); await a.type('#wd-mn', '山');
  await a.tapDo('addOne');
  await a.settle();

  await a.goRoute('langs');
  await a.shot('lg-list');
  say('  list: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean)));
  await a.tapDo('langNew');
  await a.shot('lg-new');
  say('  after 言語を追加: where=' + await a.where() +
      '  langs=' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => langNameOf(k)))));
  /* 名前を付ける */
  await a.goRoute('set', 'lang');
  await a.tapDo('editName');
  await a.shot('lg-name-form');
  say('  name form buttons: ' + JSON.stringify(await a.buttons()));
  await a.type('#ln-nm', 'ロレン');
  if (!(await a.tapDo('saveName'))) await a.tapDo('keepPress');
  await a.settle();
  await a.shot('lg-named');
  say('  now: langId=' + await a.pg.evaluate(() => langNameOf(langId)) +
      '  words=' + await a.pg.evaluate(() => WORDS.length));

  /* 二本目に語を入れる */
  await a.goRoute('words');
  await a.shot('lg-B-empty');
  say('  standing in: ' + await a.pg.evaluate(() => langNameOf(langId)) +
      '  WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  LETTERS=' + await a.pg.evaluate(() => LETTERS.length) +
      '  SND=' + await a.pg.evaluate(() => (typeof SND !== 'undefined' && SND ? SND.length : -1)));
  const opened = await a.tapDo('openAdd');
  say('  openAdd pressed=' + opened + ' where=' + await a.where() +
      ' fields=' + JSON.stringify(await a.pg.evaluate(() =>
        Array.prototype.map.call(document.querySelectorAll('#app input,#app textarea'),
          e => '#' + (e.id || e.className)))));
  await a.type('#wd-ln', 'zzz'); await a.type('#wd-mn', 'ロレンの語');
  await a.shot('lg-B-typed');
  say('  typed: wd-ln holds ' + JSON.stringify(await a.pg.evaluate(() =>
    (document.getElementById('wd-ln') || {}).value || '')) +
    '  addW=' + await a.pg.evaluate(() => JSON.stringify(
      typeof addW !== 'undefined' && addW ? { hw: addW.hw, mn: addW.mn } : null)));
  await a.tapDo('addOne');
  await a.shot('lg-B-added');
  say('  after 追加: where=' + await a.where() + '  WORDS=' +
      await a.pg.evaluate(() => WORDS.length) + '  screen=' +
      JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 6)));
  await a.settle();
  await a.goRoute('words');
  await a.shot('lg-B-words');
  say('  language 2 words: ' + await a.pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw))));

  /* 切り替えて戻る */
  await a.goRoute('langs');
  await a.shot('lg-list-2');
  const rows = (await a.buttons()).filter(b => b.indexOf('langOpen') === 0);
  say('  rows: ' + JSON.stringify(rows));
  const first = JSON.parse(rows[0].slice(rows[0].indexOf('['), rows[0].indexOf(']') + 1));
  await a.tapArg('langOpen', first);
  await a.settle();
  await a.goRoute('words');
  await a.shot('lg-switched');
  say('  after switching: ' + await a.pg.evaluate(() => langNameOf(langId)) +
      '  words=' + await a.pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw))));

  /* 片方を消す */
  await a.goRoute('set', 'acct');
  await a.tapDo('wipeLangs');
  await a.shot('lg-drop-ask');
  say('  drop pop: "' + await a.pop() + '"');
  await a.tapDo('popYes');
  await a.settle();
  await a.shot('lg-dropped');
  say('  after deleting this language: where=' + await a.where() +
      '  langs=' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => langNameOf(k)))) +
      '  words=' + await a.pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw))));
  await a.reload();
  await a.goRoute('langs');
  await a.shot('lg-relaunch');
  say('  after relaunch: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean)));
  say('  server languages: ' + JSON.stringify(srv.db.language.map(l => l.name)));
  return a;
};

/* ---- 13. アカウント削除 → 同じメールで作り直す ------------------------------ */
WALKS['13'] = async (br, srv) => {
  say('--- 13. delete the account, then make it again ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  await a.goRoute('words');
  await a.tapDo('openAdd');
  await a.type('#wd-ln', 'kano'); await a.type('#wd-mn', '山');
  await a.tapDo('addOne');
  await a.settle();
  say('  before: words=' + await a.pg.evaluate(() => WORDS.length) +
      '  server langs=' + srv.db.language.length + '  slices=' + srv.db.slice.length);

  await a.goRoute('set', 'acct');
  await a.tapDo('wipeAll');
  await a.shot('del-ask');
  say('  delete pop: "' + await a.pop() + '"');
  await a.tapDo('popYes');
  await a.quiet(1200);
  await a.shot('del-ask-2');
  say('  second pop: "' + await a.pop() + '"');
  if (await a.pop()){ await a.tapDo('popYes'); await a.quiet(1200); }
  await a.shot('del-done');
  say('  after deleting: appIs=' + await a.pg.evaluate(() => appIs()) +
      '  where=' + await a.where() +
      '\n   server: users=' + srv.db.users.length + ' profiles=' + srv.db.profile.length +
      ' langs=' + srv.db.language.length + ' slices=' + srv.db.slice.length);
  say('  what is left in localStorage: ' + JSON.stringify(
    await a.pg.evaluate(() => Object.keys(localStorage).sort())));

  /* 同じメールでもう一度 */
  await a.reload();
  await a.shot('del-relaunch');
  say('  after relaunch: appIs=' + await a.pg.evaluate(() => appIs()) +
      '  words=' + await a.pg.evaluate(() => WORDS.length) +
      '  langs=' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => langNameOf(k)))));

  /* 同じメールでもう一度アカウントを作る */
  await a.tapArg('obMailGo', ['up']);
  await a.type('#ob-em', AYA.email);
  await a.tapDo('obMailUp');
  await a.shot('del-again-code');
  say('  same address again: where=' + await a.where() +
      '  screen=' + JSON.stringify((await a.text()).split('\n')
        .filter(x => x && !/^(English|Español|Português|Français|Deutsch|Italiano|Русский|中文|한국어|日本語)$/.test(x)).slice(0, 6)));
  await a.type('#ob-code', '12345678');
  await a.tapDo('obMailCode');
  await a.type('#ob-pw', AYA.pw);
  await a.tapDo('obNewPwGo');
  await a.type('#ob-hd', AYA.handle);
  await a.type('#ob-nm', AYA.name);
  await a.tapDo('obWhoGo');
  await a.pg.waitForTimeout(2000); await a.quiet();
  await a.reload();
  await a.shot('del-again-in');
  say('  made again: handle=' + await a.pg.evaluate(() => String(ME.handle)) +
      '  words=' + await a.pg.evaluate(() => WORDS.length) +
      '  langs=' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => langNameOf(k)))) +
      '\n   server: langs=' + JSON.stringify(srv.db.language.map(l => l.name)) +
      ' slices=' + srv.db.slice.length + ' posts=' + srv.db.post.length);
  await a.goRoute('langs');
  await a.shot('del-again-langs');
  say('  言語の一覧: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean)));
  return a;
};

/* ---- 14. 電波なし --------------------------------------------------------- */
WALKS['14'] = async (br, srv) => {
  say('--- 14. no signal ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();
  await a.goRoute('words');
  await a.tapDo('openAdd');
  await a.type('#wd-ln', 'kano'); await a.type('#wd-mn', '山');
  await a.tapDo('addOne');
  await a.settle();

  await a.offline(true);
  await a.shot('off-before-reload');
  /* 見る */
  await a.goRoute('words');
  await a.shot('off-words');
  say('  offline, the dictionary: rows=' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app [data-do^="openWord"]').length));
  await a.tapArg('goTab', ['feed']);
  await a.shot('off-feed');
  say('  offline, the timeline: ' +
      JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 6)));

  /* 書こうとする */
  await a.goRoute('words');
  await a.tapDo('openAdd');
  await a.type('#wd-ln', 'sar'); await a.type('#wd-mn', '川');
  await a.tapDo('addOne');
  await a.pg.waitForTimeout(2500); await a.quiet();
  await a.shot('off-added');
  say('  offline, after adding a word: WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  where=' + await a.where() + '  pop="' + await a.pop() + '"' +
      '  text=' + JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 4)));

  await a.tapArg('goTab', ['feed']);
  await a.tapDo('openPost');
  await a.type('#pw-ln', 'kano'); await a.type('#pw-mn', 'やま');
  await a.tapDo('pwSend');
  await a.pg.waitForTimeout(2500); await a.quiet();
  await a.shot('off-post');
  say('  offline, after 投稿する: where=' + await a.where() +
      '  posts on server=' + srv.db.post.length +
      '  text=' + JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 6)));

  /* 電波が戻る */
  await a.offline(false);
  await a.reload();
  await a.goRoute('words');
  await a.shot('off-back');
  say('  back on: WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  server words=' + JSON.stringify(srv.db.slice.filter(x => x.kind === 'words')
        .map(x => { try { return JSON.parse(x.body).length; } catch (e) { return '?'; } })) +
      '  posts=' + srv.db.post.length);
  return a;
};

/* ---- 15. 古い端末 -------------------------------------------------------- */
WALKS['15'] = async (br, srv) => {
  say('--- 15. an old phone: the shapes an earlier version left ---');
  /* 前の形：`lingua.<id>.<slice>` がディスクに、id は `L…`、SET.plan 直書き。 */
  /* `LANGS` は id を鍵にした object で、古い id は `L` + 36進のミリ秒で
     ダッシュが無い（langsOldId がそこで見分ける）。配列で書くと migration が
     何もしないので、そこは合わせる。 */
  const old = 'Lm5k3x9q';
  const ls = {
    'lingua.langs': JSON.stringify({ [old]: { mine: true, nm: '古い言語' } }),
    'lingua.cur': old,
    'lingua.set': JSON.stringify({ walked: true, plan: 'pro', theme: 'dark',
                                   ui: 'ja', myfont: true, recent: ['むかし'] }),
    ['lingua.' + old + '.words']: JSON.stringify([
      { hw: 'kano', ph: ['k', 'a', 'n', 'o'], mn: '山', mns: ['山'], pos: 'n', at: 1 },
      { hw: 'sar', ph: ['s', 'a', 'r'], mn: '川', mns: ['川'], pos: 'n', at: 2 }]),
    ['lingua.' + old + '.letters']: JSON.stringify([
      { id: 'lt.a', ch: 'a', ph: 'a', st: [] },
      { id: 'lt.k', ch: 'k', ph: 'k', st: [] }]),
    ['lingua.' + old + '.notes']: JSON.stringify([{ t: '古いメモ', at: 1 }])
  };
  const a = await new Dev(br, srv, 'A').open(ls);
  await a.shot('old-open');
  say('  on opening: appIs=' + await a.pg.evaluate(() => appIs()) +
      '  langs=' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => k + '="' + langNameOf(k) + '"'))) +
      '\n   WORDS=' + await a.pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw))) +
      '  LETTERS=' + await a.pg.evaluate(() => LETTERS.length) +
      '  plan=' + await a.pg.evaluate(() => plan()) +
      '  theme=' + await a.pg.evaluate(() => SET.theme));

  /* 門をくぐる ── 古い端末の人がサインインしたら何が残るか */
  await a.tapArg('obMailGo', ['up']);
  await a.type('#ob-em', 'old@example.com');
  await a.tapDo('obMailUp');
  await a.type('#ob-code', '12345678');
  await a.tapDo('obMailCode');
  await a.type('#ob-pw', 'hunter44pw');
  await a.tapDo('obNewPwGo');
  await a.type('#ob-hd', 'old');
  await a.type('#ob-nm', '古い人');
  await a.tapDo('obWhoGo');
  await a.pg.waitForTimeout(2200); await a.quiet();
  await a.reload();
  await a.shot('old-after-door');
  say('  after the door: WORDS=' + await a.pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw))) +
      '  langs=' + await a.pg.evaluate(() => JSON.stringify(
        Object.keys(LANGS).map(k => langNameOf(k)))) +
      '\n   server languages=' + JSON.stringify(srv.db.language.map(l => l.name)) +
      '  words slices=' + JSON.stringify(srv.db.slice.filter(x => x.kind === 'words')
        .map(x => { try { return JSON.parse(x.body).map(w => w.hw); } catch (e) { return '?'; } })));
  await a.goRoute('words');
  await a.shot('old-words');
  say('  dictionary rows on screen: ' + await a.pg.evaluate(() =>
    document.querySelectorAll('#app [data-do^="openWord"]').length));
  await a.goRoute('langs');
  await a.shot('old-langs');
  say('  言語の一覧: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean)));
  say('  disk keys still there: ' + JSON.stringify(
    (await a.pg.evaluate(() => Object.keys(localStorage).sort()))
      .filter(k => k.indexOf(old) >= 0)));
  return a;
};

/* ---- 16. 課金 ------------------------------------------------------------- */
WALKS['16'] = async (br, srv) => {
  say('--- 16. money ---');
  const a = await new Dev(br, srv, 'A').open();
  await arrive(a, AYA, false);
  await a.reload();

  /* 無料で有料のものを押す */
  await a.goRoute('kb');
  await a.shot('pay-kb-free');
  say('  free, the keyboard chapter: ' + JSON.stringify(await a.buttons()));
  await a.tapDo('kbNew');
  await a.shot('pay-kb-new');
  say('  free, pressed キーボードを追加: where=' + await a.where() +
      '  pop="' + await a.pop() + '"');
  await a.popShut();

  await a.goRoute('ltset', 'alpha');
  await a.tapArg('newLetter', ['alpha']);
  await a.shot('pay-lt-free');
  say('  free, pressed 文字の追加: pop="' + await a.pop() + '"');
  await a.popShut();

  /* 語の上限 */
  say('  word ceiling: ' + await a.pg.evaluate(() => wordCap()));

  /* 買う */
  srv.db.planIs = 'pro';
  await a.pg.evaluate(() => planTook('pro'));
  await a.quiet(); await a.popShut();
  await a.goRoute('kb');
  await a.tapDo('kbNew');
  await a.tapArg('kbAdd', ['qwerty']);
  await a.settle();
  await a.shot('pay-kb-pro');
  say('  pro: boards=' + await a.pg.evaluate(() => kbBoards().length) +
      '  word ceiling=' + await a.pg.evaluate(() => wordCap()));
  /* 有料で語を増やす */
  for (const w of ['aa', 'bb', 'cc']){
    await a.goRoute('words');
    await a.tapDo('openAdd');
    await a.type('#wd-ln', w); await a.type('#wd-mn', w);
    await a.tapDo('addOne');
  }
  await a.settle();
  say('  pro: WORDS=' + await a.pg.evaluate(() => WORDS.length));

  /* 期限が切れる */
  srv.db.planIs = 'free';
  await a.pg.evaluate(() => planTook('free'));
  await a.quiet();
  await a.shot('pay-lapsed');
  say('  after the plan ends: where=' + await a.where() + '  pop="' + await a.pop() + '"' +
      '  plan=' + await a.pg.evaluate(() => plan()) +
      '  planWas=' + await a.pg.evaluate(() => String(SET.planWas || '')) +
      '\n   screen: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 8)));
  await a.popShut();
  await a.goRoute('words');
  await a.shot('pay-words-after');
  say('  words still in WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  rows on screen=' + await a.pg.evaluate(() =>
        document.querySelectorAll('#app [data-do^="openWord"]').length) +
      '\n   screen says: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 6)));
  await a.goRoute('kb');
  await a.shot('pay-kb-after');
  say('  keyboards after the plan ended: ' +
      JSON.stringify((await a.buttons()).filter(b => /kbGoBoard|kbNew/.test(b))) +
      '\n   screen: ' + JSON.stringify((await a.text()).split('\n').filter(Boolean).slice(0, 8)));
  await a.reload();
  await a.goRoute('words');
  await a.shot('pay-relaunch');
  say('  after relaunch: WORDS=' + await a.pg.evaluate(() => WORDS.length) +
      '  server words=' + JSON.stringify(srv.db.slice.filter(x => x.kind === 'words')
        .map(x => { try { return JSON.parse(x.body).length; } catch (e) { return '?'; } })));
  return a;
};

/* ===========================================================================
   走らせる
   ======================================================================== */
async function main(){
  const want = process.argv.slice(2).filter(x => !x.startsWith('-'));
  const keys = want.length ? want : Object.keys(WALKS);
  /* 声は MediaRecorder を通るので、偽のマイクを付けて開く。 */
  const br = await chromium.launch(Object.assign({}, LAUNCH, {
    args: (LAUNCH.args || []).concat([
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
  }));
  /* 道ごとに新しいサーバー。同じメールで二度アカウントを作れないので、
     一つのサーバーを通しで使うと二本目の道が門で止まる。 */
  let srv = newServer();
  for (const k of keys){
    if (!WALKS[k]){ say('no walk ' + k); continue; }
    srv = newServer();
    try { await WALKS[k](br, srv); }
    catch (e) { say('WALK ' + k + ' threw: ' + (e && e.message)); NOTE.push({ walk: k, err: String(e && e.stack).split('\n').slice(0,3).join(' | ') }); }
  }
  await br.close();
  if (process.env.HUNT_LOG){
    say('\n--- every request ---');
    srv.db.log.forEach(l => say('  ' + l.m + ' ' + l.p + (l.q ? '?' + l.q : '') +
      (l.b ? '\n      body ' + l.b : '') + (l.bad ? '  -> ' + l.bad : '')));
    say('--- db ---');
    say('  users ' + JSON.stringify(srv.db.users));
    say('  profile ' + JSON.stringify(srv.db.profile));
    say('  language ' + JSON.stringify(srv.db.language));
    say('  slice ' + srv.db.slice.map(x => x.kind + ':' + x.body.length).join(' '));
  }
  const bad = srv.db.log.filter(l => l.bad);
  void 0;
  if (bad.length){
    say('\n--- server said no ---');
    bad.slice(-25).forEach(l => say('  ' + l.m + ' ' + l.p + '  -> ' + l.bad));
  }
  if (NOTE.length){
    say('\n--- page errors / throws ---');
    NOTE.forEach(n => say('  ' + JSON.stringify(n)));
  }
  say('\nshots in shots/hunt/');
}
main();
