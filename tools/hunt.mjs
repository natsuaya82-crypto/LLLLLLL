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

    if (m === 'GET')
      return { status: 200, text: JSON.stringify(pick(keep(rows, par), par.select)) };

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
    await this.pg.route('**/storage/v1/object/public/**',
      r => r.fulfill({ status: 200, contentType: 'image/gif',
        body: Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64') }));
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
  async tapArg(name, args){
    const sel = '[data-do="' + name + '"][data-a=' +
      JSON.stringify(JSON.stringify([].concat(args))) + ']';
    const el = this.pg.locator(sel).first();
    if (!(await el.count())) return false;
    await el.click({ timeout: 4000 }).catch(() => {});
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
    const r = r0.trim().split(':');
    await a.goRoute(r[0], r[1] || '');
    say('== ' + r0 + ' == ' + (await a.where()));
    (await a.buttons()).forEach(b => say('   ' + b));
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

/* ===========================================================================
   走らせる
   ======================================================================== */
async function main(){
  const want = process.argv.slice(2).filter(x => !x.startsWith('-'));
  const keys = want.length ? want : Object.keys(WALKS);
  const br = await chromium.launch(LAUNCH);
  const srv = newServer();
  for (const k of keys){
    if (!WALKS[k]){ say('no walk ' + k); continue; }
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
