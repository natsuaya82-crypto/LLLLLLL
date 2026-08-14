/* ---------------------------------------------------------------------------
   tools/rls-check.mjs — somebody else tries, and cannot.

   Run it:   npm run rls        (needs a local PostgreSQL; see the end)

   Supabase has no server of ours in front of it. The phone talks to the
   database directly, which means anybody can send it any request they like --
   the app is a suggestion, not a gate. The only thing standing between a
   stranger and somebody's language is the row level security in
   supabase/schema.sql: a paragraph of policies saying, row by row, who may
   read and who may write.

   That is the whole of the security of this app, and it is the one part of it
   that is invisible. A policy that is too wide breaks nothing. Nothing throws,
   no screen looks wrong, every screenshot is right, and npm test is green,
   because there is only ever one person in a test. It is found on the day
   somebody who spent four months on a language finds it rewritten.

   So this file is not a test of the schema. It is a second person. It stands
   up a real PostgreSQL, applies schema.sql to it unchanged, and then tries --
   as B, and as somebody with no account at all -- to do every single thing to
   A that the file promises cannot be done. A "denied" is either refusal the
   database can make: an error when writing a row the policy forbids, or zero
   rows when reading or changing rows the policy hides. Both are wins; the
   distinction is printed because a claim that passes for the wrong reason is
   worth knowing about.

   It is NOT part of npm test, and deliberately: it needs a PostgreSQL, and
   the gate has to run on a laptop in an airport. Run it whenever schema.sql
   is touched -- that is the only time it can start failing.

   What it does not prove:
     - that Supabase's real auth issues the claims this stubs. auth.uid() and
       auth.jwt() below are written the way Supabase writes them, off one
       claims blob, but they are ours
     - anything about the app. Whether the phone SENDS author = its own uid is
       www/'s business; this proves that lying about it does not work
   --------------------------------------------------------------------------- */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = path.join(HERE, '..', 'supabase', 'schema.sql');

const A = 'a0000000-0000-4000-8000-000000000001';   /* whose language it is */
const B = 'b0000000-0000-4000-8000-000000000002';   /* somebody else */
const L = 'c0000000-0000-4000-8000-000000000003';   /* the language */
const P = 'd0000000-0000-4000-8000-000000000004';   /* the post */

/* What Supabase already has when schema.sql is pasted into it. None of this is
   ours -- it is the ground the file is poured onto, and it is here so that the
   file can be applied UNCHANGED, which is the only version worth testing. */
const GROUND = `
create extension if not exists pgcrypto;
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
do $$ begin create role anon nologin;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin;  exception when duplicate_object then null; end $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Storage, as much of it as the policies touch. Supabase's own storage schema
-- is a dozen tables and a REST service; what schema.sql says about it is two
-- columns and a name, and those are what somebody would attack. A file put
-- under another person's uuid is the whole of the threat, and it needs a
-- bucket_id and a name to be tried.
create schema if not exists storage;
create table storage.buckets (
  id text primary key, name text not null, public boolean not null default false);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text not null,
  owner uuid);
grant usage on schema storage to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
-- A second bucket, so "you may not write into another bucket" is refused by
-- the POLICY rather than by a foreign key. A missing row and a closed door
-- look identical from the outside and only one of them is the claim.
insert into storage.buckets (id, name, public) values ('other', 'other', true);
`;

/* Every claim schema.sql makes, as somebody trying to break it. Adding a
   policy means adding the line here that somebody would use against it --
   a policy with no attempt against it is a policy nobody has read. */
const CASES = [
  /* --- everybody writes themselves into existence, and only themselves --- */
  ['A makes A\u2019s profile',                'ok',     A, 0,
    `insert into profile(id,handle) values ('${A}','aya')`],
  ['B makes B\u2019s profile',                'ok',     B, 0,
    `insert into profile(id,handle) values ('${B}','iri')`],
  ['B cannot make a profile for A',           'denied', B, 0,
    `insert into profile(id,handle) values ('${A}','fake')`],
  ['B cannot rename A',                       'denied', B, 0,
    `update profile set display='hacked' where id='${A}'`],
  ['nobody signed in reads profiles',         'ok',     B, 1, `select 1 from profile`],
  ['nobody signed in makes one',              'denied', B, 1,
    `insert into profile(id,handle) values (gen_random_uuid(),'ghost')`],

  /* --- a language is the owner\u2019s, and unpublished means unpublished --- */
  ['A makes A\u2019s language',               'ok',     A, 0,
    `insert into language(id,owner,name) values ('${L}','${A}','Ayan')`],
  ['A reads A\u2019s unpublished language',   'ok',     A, 0,
    `select 1 from language where id='${L}'`],
  ['B cannot see it while unpublished',       'denied', B, 0,
    `select 1 from language where id='${L}'`],
  ['B cannot rewrite it',                     'denied', B, 0,
    `update language set name='mine now' where id='${L}'`],
  ['B cannot delete it',                      'denied', B, 0,
    `delete from language where id='${L}'`],
  ['B cannot make a language owned by A',     'denied', B, 0,
    `insert into language(owner,name) values ('${A}','forged')`],
  ['A publishes it',                          'ok',     A, 0,
    `update language set published_at=now() where id='${L}'`],
  ['published, B reads it',                   'ok',     B, 0,
    `select 1 from language where id='${L}'`],
  ['published, B still cannot rewrite it',    'denied', B, 0,
    `update language set name='mine now' where id='${L}'`],

  /* --- the record that settles arguments without anybody judging one --- */
  ['A records publishing A\u2019s language',  'ok',     A, 0,
    `insert into publication(language,actor,kind,digest) values ('${L}','${A}','language','sha')`],
  ['B cannot record against A\u2019s language','denied', B, 0,
    `insert into publication(language,actor,kind,digest) values ('${L}','${B}','language','sha')`],
  ['A cannot alter A\u2019s own record',      'denied', A, 0,
    `update publication set digest='rewritten'`],
  ['A cannot delete A\u2019s own record',     'denied', A, 0,
    `delete from publication`],

  /* --- what somebody said, once --- */
  ['A posts',                                 'ok',     A, 0,
    `insert into post(id,author,language,body) values ('${P}','${A}','${L}','{}'::jsonb)`],
  ['B cannot post as A',                      'denied', B, 0,
    `insert into post(author,body) values ('${A}','{}'::jsonb)`],
  ['B cannot edit A\u2019s post',             'denied', B, 0,
    `update post set body='{"x":1}'::jsonb where id='${P}'`],
  ['B cannot delete A\u2019s post',           'denied', B, 0,
    `delete from post where id='${P}'`],
  ['nobody signed in reads the feed',         'ok',     B, 1, `select 1 from post`],
  ['nobody signed in posts',                  'denied', B, 1,
    `insert into post(author,body) values ('${B}','{}'::jsonb)`],

  /* --- the citation count, which is the one number that matters --- */
  ['A cites a language in A\u2019s post',     'ok',     A, 0,
    `insert into quote(post,language,word) values ('${P}','${L}','sina')`],
  ['B cannot add citations to A\u2019s post', 'denied', B, 0,
    `insert into quote(post,language,word) values ('${P}','${L}','forged')`],
  ['B cannot delete A\u2019s citations',      'denied', B, 0,
    `delete from quote where post='${P}'`],

  /* --- the day\u2019s sentence comes from us or from nobody --- */
  ['anyone reads the day\u2019s sentence',    'ok',     B, 0,
    `select 1 from prompt where false union all select 1`],
  ['nobody writes one',                       'denied', B, 0,
    `insert into prompt(on_day,text) values (current_date,'forged')`],

  /* --- following is something you do, not something done to you --- */
  ['B follows A',                             'ok',     B, 0,
    `insert into follow(follower,followed) values ('${B}','${A}')`],
  ['B cannot make A follow B',                'denied', B, 0,
    `insert into follow(follower,followed) values ('${A}','${B}')`],
  ['B cannot unfollow on A\u2019s behalf',    'denied', B, 0,
    `delete from follow where follower='${A}'`],
  ['nobody signed in follows',                'denied', B, 1,
    `insert into follow(follower,followed) values ('${B}','${A}')`],

  /* --- a like is yours to give and yours to take back, and nobody else's --- */
  ['B likes A\u2019s post',                    'ok',     B, 0,
    `insert into react(post,actor,kind) values ('${P}','${B}','like')`],
  ['B boosts it too',                         'ok',     B, 0,
    `insert into react(post,actor,kind) values ('${P}','${B}','boost')`],
  ['A cannot like it in B\u2019s name',        'denied', A, 0,
    `insert into react(post,actor,kind) values ('${P}','${B}','like')`],
  ['A cannot take B\u2019s like away',         'denied', A, 0,
    `delete from react where actor='${B}' and kind='like'`],
  ['anyone counts the likes',                 'ok',     A, 0,
    `select count(*) from react where post='${P}'`],
  ['nobody signed in likes',                  'denied', B, 1,
    `insert into react(post,actor,kind) values ('${P}','${B}','like')`],
  ['B takes B\u2019s own boost back',          'ok',     B, 0,
    `delete from react where actor='${B}' and kind='boost'`],

  /* --- a reply points at what it answers, and only its author writes it --- */
  ['B answers A\u2019s post',                  'ok',     B, 0,
    `insert into post(author,body,reply_to) values ('${B}','{}'::jsonb,'${P}')`],
  ['B cannot answer as A',                    'denied', B, 0,
    `insert into post(author,body,reply_to) values ('${A}','{}'::jsonb,'${P}')`],

  /* --- the bytes: a file goes under your own uuid and nowhere else --- */
  ['A puts a picture under A',                'ok',     A, 0,
    `insert into storage.objects(bucket_id,name) values ('post-media','${A}/${P}/0.jpg')`],
  ['A cannot put one under B',                'denied', A, 0,
    `insert into storage.objects(bucket_id,name) values ('post-media','${B}/${P}/0.jpg')`],
  ['A cannot put one in a bucket that is not this one', 'denied', A, 0,
    `insert into storage.objects(bucket_id,name) values ('other','${A}/x.jpg')`],
  ['B cannot delete A\u2019s picture',         'denied', B, 0,
    `delete from storage.objects where name='${A}/${P}/0.jpg'`],
  ['anyone reads a picture',                  'ok',     B, 0,
    `select 1 from storage.objects where bucket_id='post-media'`],
  ['nobody signed in uploads',                'denied', B, 1,
    `insert into storage.objects(bucket_id,name) values ('post-media','${B}/x.jpg')`],
  ['A deletes A\u2019s own picture',           'ok',     A, 0,
    `delete from storage.objects where name='${A}/${P}/0.jpg'`]
];

/* The shape of the file itself, which the prose in schema.sql promises and
   which no attempt above can see: a table with row level security switched
   off is wide open no matter what its policies say, and a table with no
   update policy is append-only precisely BECAUSE the policy is missing. */
const SHAPE = [
  /* _r is this file's own scratch table and is the one thing in the schema
     that is not the schema's, so it is the one thing excluded. */
  ['row level security is on for every table', `
     select count(*) from pg_tables
      where schemaname in ('public','storage')
        and tablename not like '\\_%' and not rowsecurity`, '0'],
  ['publication can never be updated',   `
     select count(*) from pg_policies where tablename='publication' and cmd='UPDATE'`, '0'],
  ['publication can never be deleted',   `
     select count(*) from pg_policies where tablename='publication' and cmd='DELETE'`, '0'],
  ['the day\u2019s sentence is read-only', `
     select count(*) from pg_policies where tablename='prompt' and cmd<>'SELECT'`, '0'],
  ['a profile is never deleted, only the account', `
     select count(*) from pg_policies where tablename='profile' and cmd='DELETE'`, '0'],
  /* A reaction is on or off. An update policy would let a row be turned into
     a different kind, and the primary key would not notice. */
  ['a reaction is never edited', `
     select count(*) from pg_policies where tablename='react' and cmd='UPDATE'`, '0'],
  /* An overwrite is how somebody else's post quietly changes under them. */
  ['a file is never overwritten', `
     select count(*) from pg_policies where tablename='objects' and cmd='UPDATE'`, '0'],
  /* Every one of these is a count that must come back zero, so "the bucket is
     there" has to be asked as "there is no world in which it is missing". */
  ['the media bucket is there and is public', `
     select count(*) from (select 1) x
      where not exists (select 1 from storage.buckets
                         where id='post-media' and public)`, '0']
];

/* ---- a PostgreSQL to throw away ----------------------------------------- */

function bindir() {
  for (const d of (fs.existsSync('/usr/lib/postgresql')
      ? fs.readdirSync('/usr/lib/postgresql').sort().reverse()
          .map((v) => `/usr/lib/postgresql/${v}/bin`)
      : [])) if (fs.existsSync(path.join(d, 'initdb'))) return d;
  for (const d of ['/usr/local/bin', '/opt/homebrew/bin', '/usr/bin'])
    if (fs.existsSync(path.join(d, 'initdb'))) return d;
  return null;
}

const BIN = bindir();
if (!BIN) {
  console.error(
    'rls-check needs a local PostgreSQL and there is none on this machine.\n' +
    '  macOS:  brew install postgresql@16\n' +
    '  Debian: apt-get install -y postgresql\n' +
    'This check is not part of npm test for exactly this reason. It is the\n' +
    'one that has to run when supabase/schema.sql changes.');
  process.exit(1);
}

/* postgres will not run as root, so as root we borrow an account that exists
   on every image that ships one. Everywhere else we are already somebody. */
const AS_ROOT = typeof process.getuid === 'function' && process.getuid() === 0;
const DIR = path.join(os.tmpdir(), 'lingua-rls');
const PORT = 55432;

function pg(cmd, args, opts) {
  const line = [path.join(BIN, cmd)].concat(args).map((a) =>
    /[^A-Za-z0-9_.:=\/-]/.test(a) ? "'" + a.replace(/'/g, "'\\''") + "'" : a).join(' ');
  if (AS_ROOT) return execFileSync('su', ['postgres', '-c', line], opts);
  return execFileSync(path.join(BIN, cmd), args, opts);
}

function stop() {
  try { pg('pg_ctl', ['-D', path.join(DIR, 'data'), '-m', 'immediate', 'stop'],
           { stdio: 'ignore' }); } catch (e) { /* it was not up */ }
}

fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true, mode: 0o777 });
fs.chmodSync(DIR, 0o777);
if (AS_ROOT) {
  try { execFileSync('id', ['-u', 'postgres'], { stdio: 'ignore' }); }
  catch (e) { execFileSync('useradd', ['postgres']); }
  execFileSync('chown', ['-R', 'postgres', DIR]);
}

process.on('exit', stop);

try {
  pg('initdb', ['-D', path.join(DIR, 'data'), '-U', 'postgres', '--auth=trust'],
     { stdio: 'ignore' });
  pg('pg_ctl', ['-D', path.join(DIR, 'data'), '-l', path.join(DIR, 'log'),
                '-o', `-k ${DIR} -p ${PORT} -c listen_addresses=`, '-w', 'start'],
     { stdio: 'ignore' });
} catch (e) {
  console.error('could not start a PostgreSQL to test against:\n' + e.message);
  process.exit(1);
}

/* ---- the run ------------------------------------------------------------- */

/* One statement, run as one person, and what the database let them do. The
   role is set to authenticated rather than left as the owner on purpose: a
   table's owner bypasses its own row level security, so a test that forgot
   this would pass every case and prove nothing. */
const HARNESS = `
create table _r(n int generated always as identity, name text, want text, got text);
create or replace function chk(nm text, want text, stmt text, sub uuid, anon boolean)
returns void language plpgsql as $$
declare c int; got text;
begin
  begin
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', sub, 'is_anonymous', anon)::text, true);
    execute stmt;
    get diagnostics c = ROW_COUNT;
    got := case when c > 0 then 'ok' else 'denied(no rows)' end;
  exception when others then
    got := 'denied(' || SQLSTATE || ')';
  end;
  execute 'set local role postgres';
  insert into _r(name, want, got) values (nm, want, got);
end $$;
`;

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const run = CASES.map(([name, want, who, anon, sql]) =>
  `select chk(${q(name)}, ${q(want)}, ${q(sql)}, ${q(who)}, ${anon ? 'true' : 'false'});`
).join('\n');

const sql = [
  GROUND,
  fs.readFileSync(SCHEMA, 'utf8'),
  HARNESS,
  'begin;',
  /* The only seeding there is. Everything else below is done BY somebody,
     through a policy, in the order a real account would do it -- a profile
     before a language, a language before a post -- because a row put here by
     the owner of the table would be a row no policy ever had to allow. */
  `insert into auth.users(id) values (${q(A)}),(${q(B)});`,
  run,
  `\\pset format unaligned`,
  `\\pset tuples_only on`,
  /* chr(9) rather than a backslash-t: PostgreSQL string literals are standard
     by default, so '\\t' in one is a backslash and a t. */
  `select name||chr(9)||want||chr(9)||got from _r order by n;`,
  SHAPE.map(([name, s]) =>
    `select ${q('SHAPE')}||chr(9)||${q(name)}||chr(9)||(${s});`).join('\n'),
  'rollback;'
].join('\n');

const file = path.join(DIR, 'run.sql');
fs.writeFileSync(file, sql);
fs.chmodSync(file, 0o644);

let out;
try {
  out = pg('psql', ['-h', DIR, '-p', String(PORT), '-U', 'postgres', '-q',
                    '-v', 'ON_ERROR_STOP=1', '-f', file],
           { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  console.error('supabase/schema.sql did not apply to an empty PostgreSQL:\n');
  console.error(String(e.stderr || e.message).trim());
  process.exit(1);
}

const rows = out.split('\n').map((l) => l.split('\t')).filter((r) => r.length === 3);
const want = CASES.length + SHAPE.length;
if (rows.length !== want) {
  console.error(`expected ${want} answers and got ${rows.length}; psql said:\n` + out);
  process.exit(1);
}

const bad = [];
for (const [a, b, c] of rows) {
  const shape = a === 'SHAPE';
  const name = shape ? b : a;
  const ok = shape ? c === '0' : (b === 'ok') === (c === 'ok');
  const said = shape ? c + ' found where there must be none' : (b === 'ok' ? '' : c);
  if (!ok) bad.push([name, shape ? 'none' : b, said]);
  console.log((ok ? '  ok    ' : '  FAIL  ') + name.padEnd(44) + (ok && shape ? '' : said));
}

console.log('');
if (bad.length) {
  console.error('somebody else got through:\n');
  for (const [n, w, g] of bad) console.error(`  ${n}\n    wanted ${w}, got ${g}\n`);
  process.exit(1);
}
console.log(`rls: ${CASES.length} attempts by somebody who is not the owner, ` +
            `none of them got through`);
console.log(`     ${SHAPE.length} things the file cannot be without, all present`);
