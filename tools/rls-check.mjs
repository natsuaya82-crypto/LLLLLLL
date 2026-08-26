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
const C = 'e0000000-0000-4000-8000-000000000005';   /* whoever reads the reports */
const D = 'd0000000-0000-4000-8000-000000000044';   /* an account with no name on it */
/* The one above staff. Not seeded like C is: it arrives by taking the handle,
   which is the whole of the claim -- schema.sql makes whoever is called
   `lingua` the one who may add staff, and nothing else in this file does. */
const E = 'e0000000-0000-4000-8000-00000000000e';   /* whoever may add staff */
/* And somebody who starts AFTER that one exists, which is the only way to
   watch what a new account is given. A and B are made before it on purpose:
   they are everybody who was already here, and nothing is written onto them. */
const F = 'f0000000-0000-4000-8000-00000000000f';   /* somebody starting today */
const LD = 'd0000000-0000-4000-8000-00000000000d';  /* the language it makes anyway */
const LB = 'b0000000-0000-4000-8000-00000000000b';  /* and the frozen account's */

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
  /* --- and the one above staff, who arrives by being called `lingua` -----
     Nothing seeds this one. It makes its own profile through the same policy
     everybody else does, and comes out of it holding both flags -- which is
     the claim: the first one is written into schema.sql and is not a step
     somebody has to remember in a dashboard. */
  ['whoever takes the handle lingua writes themselves in', 'ok', E, 0,
    `insert into profile(id,handle) values ('${E}','lingua')`],
  ['and answers reports without being made staff', 'ok', E, 0,
    `select 1 from profile where id='${E}' and staff`],
  ['and is the one above that',               'ok',     E, 0,
    `select 1 from profile where id='${E}' and admin`],
  ['B is neither',                            'denied', B, 0,
    `select 1 from profile where id='${B}' and (staff or admin)`],
  ['B cannot become the one above staff',     'denied', B, 0,
    `update profile set admin=true where id='${B}'`],
  /* --- and what somebody starting today starts with ----------------------
     「他の人が始めたらlinguaアカウントは強制的にフォローしてる状態にしたい」
     「A: 初期状態としてフォロー済み。外せる」 -- so both halves are asked
     here, and the second is the one that makes it a follow rather than
     something else wearing the word. A and B are above this line and get
     nothing: the row is written when a profile is made, and theirs were. */
  ['somebody starting now writes themselves in', 'ok',   F, 0,
    `insert into profile(id,handle) values ('${F}','veth')`],
  ['and is already following lingua',         'ok',     F, 0,
    `select 1 from follow where follower='${F}' and followed='${E}'`],
  ['B cannot take that follow off for them',  'denied', B, 0,
    `delete from follow where follower='${F}' and followed='${E}'`],
  ['but they can',                            'ok',     F, 0,
    `delete from follow where follower='${F}' and followed='${E}'`],
  ['and then it is gone',                     'denied', F, 0,
    `select 1 from follow where follower='${F}' and followed='${E}'`],
  ['lingua is not made to follow itself',     'denied', E, 0,
    `select 1 from follow where follower='${E}'`],
  ['and nobody who was already here was given one', 'denied', B, 0,
    `select 1 from follow where follower='${B}' and followed='${E}'`],
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

  /* --- an account with no name on it, which is what every first launch has -
     The app signs itself in anonymously before the first frame, so a language
     is made by somebody who has not said who they are and may never say. That
     is the whole reason has_account() exists beside is_member(), and D is the
     only account in this file that never gets a profile row -- which is also
     why language.owner points at auth.users rather than at profile.

     The pair to read together is the first line and the fourth: it may make a
     language, and it may not make a post. */
  ['an anonymous account makes a language',   'ok',     D, 1,
    `insert into language(id,owner,name) values ('${LD}','${D}','Nen')`],
  ['and reads its own back',                  'ok',     D, 1,
    `select 1 from language where id='${LD}'`],
  ['and renames it',                          'ok',     D, 1,
    `update language set name='Nenu' where id='${LD}'`],
  ['but cannot post',                         'denied', D, 1,
    `insert into post(author,body) values ('${D}','{}'::jsonb)`],
  ['nor give itself a handle',                'denied', D, 1,
    `insert into profile(id,handle) values ('${D}','nobody')`],
  ['nor follow anybody',                      'denied', D, 1,
    `insert into follow(follower,followed) values ('${D}','${A}')`],
  ['nor publish what it made',                'denied', D, 1,
    `insert into publication(language,actor,kind,digest)
       values ('${LD}','${D}','language','sha')`],
  ['nor own a language of A\u2019s',          'denied', D, 1,
    `insert into language(owner,name) values ('${A}','forged')`],
  ['and nobody else sees it',                 'denied', B, 0,
    `select 1 from language where id='${LD}'`],
  /* And what the language is MADE of. A slice is the dictionary, the
     alphabet, the keyboard -- the whole of what somebody spends months on --
     and it is the one thing in this file that nobody but its owner may read.
     Not even for a published language: publishing is a copy somebody is
     given, not a door into the phone. */
  ['and puts its dictionary in it',           'ok',     D, 1,
    `insert into slice(language,kind,body) values ('${LD}','words','[1]')`],
  ['and reads it back',                       'ok',     D, 1,
    `select 1 from slice where language='${LD}' and kind='words'`],
  ['and writes over it',                      'ok',     D, 1,
    `update slice set body='[1,2]', no=2 where language='${LD}' and kind='words'`],
  ['B cannot read it',                        'denied', B, 0,
    `select 1 from slice where language='${LD}'`],
  ['B cannot write into it',                  'denied', B, 0,
    `insert into slice(language,kind,body) values ('${LD}','letters','[]')`],
  ['B cannot rewrite it',                     'denied', B, 0,
    `update slice set body='[]' where language='${LD}' and kind='words'`],
  ['B cannot delete it',                      'denied', B, 0,
    `delete from slice where language='${LD}'`],
  ['nor can somebody with no account at all',  'denied', B, 1,
    `select 1 from slice where language='${LD}'`],
  /* L is A's and it is PUBLISHED by this point in the file. A published
     language is a copy somebody is given; what it is made of stays A's. */
  ['B cannot read a published language\u2019s slices', 'denied', B, 0,
    `select 1 from slice where language='${L}'`],
  ['B cannot put a slice on A\u2019s language', 'denied', B, 0,
    `insert into slice(language,kind,body) values ('${L}','words','[]')`],

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
    `insert into post(id,author,language,body)
       values ('${P}','${A}','${L}','{"ln":"the words somebody was reported for"}'::jsonb)`],
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

  /* --- a block is yours, and being blocked is not something you find out --- */
  ['B blocks A',                              'ok',     B, 0,
    `insert into block(actor,blocked) values ('${B}','${A}')`],
  ['B reads B\u2019s own blocks',              'ok',     B, 0,
    `select 1 from block where actor='${B}'`],
  ['A cannot see that A is blocked',          'denied', A, 0,
    `select 1 from block where blocked='${A}'`],
  ['A cannot block in B\u2019s name',          'denied', A, 0,
    `insert into block(actor,blocked) values ('${B}','${A}')`],
  ['A cannot lift B\u2019s block',             'denied', A, 0,
    `delete from block where actor='${B}'`],
  ['nobody signed in blocks',                 'denied', B, 1,
    `insert into block(actor,blocked) values ('${B}','${A}')`],

  /* --- a report is written and never read back by anybody using the app --- */
  ['B reports A\u2019s post',                  'ok',     B, 0,
    `insert into report(actor,post,why) values ('${B}','${P}','spam')`],
  ['B reports A',                             'ok',     B, 0,
    `insert into report(actor,who,why,note) values ('${B}','${A}','abuse','x')`],
  ['B cannot read the report B wrote',        'denied', B, 0,
    `select 1 from report where actor='${B}'`],
  ['A cannot read what was said about A',     'denied', A, 0,
    `select 1 from report where who='${A}'`],
  ['A cannot report in B\u2019s name',         'denied', A, 0,
    `insert into report(actor,post,why) values ('${B}','${P}','spam')`],
  ['A cannot delete a report about A',        'denied', A, 0,
    `delete from report where who='${A}'`],
  ['a report cannot be edited',               'denied', B, 0,
    `update report set why='other' where actor='${B}'`],
  ['a reason outside the five is refused',    'denied', B, 0,
    `insert into report(actor,post,why) values ('${B}','${P}','whatever')`],
  ['a report about nothing is refused',       'denied', B, 0,
    `insert into report(actor,why) values ('${B}','spam')`],
  ['nobody signed in reports',                'denied', B, 1,
    `insert into report(actor,post,why) values ('${B}','${P}','spam')`],

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
    `delete from storage.objects where name='${A}/${P}/0.jpg'`],

  /* --- answering a report ------------------------------------------------
     Last, because taking a post down changes what everything above can see,
     and it is put back at the foot of this block so that the order of the
     file stays something anybody can add to. */
  ['staff reads the reports',                 'ok',     C, 0,
    `select 1 from report`],
  /* And the four numbers, which are the same door with a different handle on
     it. A count that anybody could ask for would be the one thing on the
     screen that did not need staff, which is how a screen ends up being the
     only thing keeping somebody out. */
  ['B cannot ask how many of everything there is', 'denied', B, 0,
    `select admin_counts()`],
  ['nor can somebody with no account at all',  'denied', B, 1,
    `select admin_counts()`],
  /* Staff too, and this is the tier doing its work: whoever answers reports
     is not whoever opens the screen with the numbers on it.
     「＠linguaのアカウントだけ管理者ページには入れる」 */
  ['staff cannot either',                     'denied', C, 0,
    `select admin_counts()`],
  ['the one above staff can',                 'ok',     E, 0,
    `select admin_counts()`],

  /* --- and who may make somebody staff ----------------------------------
     The whole reason there are two tiers. A staff account that could make
     another staff account is one account away from every account being one,
     and the owner would find out by reading a report they did not answer. */
  ['B cannot make somebody staff',            'denied', B, 0,
    `select staff_add('iri')`],
  ['nor can staff',                           'denied', C, 0,
    `select staff_add('iri')`],
  ['nor can somebody with no account',        'denied', B, 1,
    `select staff_add('iri')`],
  ['the one above staff can',                 'ok',     E, 0,
    `select staff_add('iri')`],
  ['and B is staff now',                      'ok',     E, 0,
    `select 1 from profile where handle='iri' and staff`],
  ['and can take it away again',              'ok',     E, 0,
    `select staff_drop('iri')`],
  ['and B is not staff any more',             'denied', E, 0,
    `select 1 from profile where handle='iri' and staff`],
  ['B cannot take staff off anybody',         'denied', B, 0,
    `select staff_drop('mod')`],
  /* The one that cannot be undone from inside the app. The call is allowed
     and does nothing, which is the point -- an error here would be a screen
     saying no, and what is wanted is a row that does not move. */
  ['the one above staff cannot be taken off it', 'ok', E, 0,
    `select staff_drop('lingua')`],
  ['and is still both after trying',          'ok',     E, 0,
    `select 1 from profile where handle='lingua' and staff and admin`],
  ['B cannot make B staff',                   'denied', B, 0,
    `update profile set staff=true where id='${B}'`],
  ['B cannot make A staff either',            'denied', B, 0,
    `update profile set staff=true where id='${A}'`],
  ['B cannot take a post down',               'denied', B, 0,
    `select post_hide('${P}','spam')`],
  ['A cannot take A\u2019s own post down',     'denied', A, 0,
    `select post_hide('${P}','spam')`],
  ['staff takes A\u2019s post down',           'ok',     C, 0,
    `select post_hide('${P}','spam')`],
  /* The ROW still comes back and its BODY does not. Hiding the row was the
     first shape of this and it left a hole in every thread the post was in:
     the replies are still there, answering something that is not, and a
     reader cannot tell "taken down" from "never existed". post_seen is what
     empties it, and `select 1` would pass either way -- so what is asked for
     here is the body. */
  ['B is still handed the row',               'ok',     B, 0,
    `select 1 from post_seen where id='${P}'`],
  ['and it says nothing',                     'ok',     B, 0,
    `select 1 from post_seen where id='${P}' and body = '{}'::jsonb`],
  ['B cannot read the words out of it',       'denied', B, 0,
    `select 1 from post_seen where id='${P}' and body ->> 'ln' is not null`],
  ['nor out of the table under it',           'denied', B, 0,
    `select 1 from post where id='${P}' and body ->> 'ln' is not null`],
  ['somebody not signed in is handed the row too', 'ok', B, 1,
    `select 1 from post_seen where id='${P}'`],
  ['and it says nothing to them either',      'denied', B, 1,
    `select 1 from post_seen where id='${P}' and body ->> 'ln' is not null`],
  ['A is still shown A\u2019s own post',       'ok',     A, 0,
    `select 1 from post_seen where id='${P}' and body ->> 'ln' is not null`],
  ['and staff can still look at it',          'ok',     C, 0,
    `select 1 from post where id='${P}'`],
  ['A cannot put A\u2019s own post back up',   'denied', A, 0,
    `update post set hidden_at=null where id='${P}'`],
  ['nor by asking for it to be shown',        'denied', A, 0,
    `select post_show('${P}')`],
  ['staff puts it back',                      'ok',     C, 0,
    `select post_show('${P}')`],
  ['and B sees it again',                     'ok',     B, 0,
    `select 1 from post where id='${P}'`],

  /* --- ejecting somebody, which is the half guideline 1.2 asks for -------
     Taking the post down leaves whoever wrote it free to write it again. What
     a ban IS, here, is one line in is_member() -- so the thing to attack is
     not the column but every door is_member() stands in. */
  ['B cannot ban A',                          'denied', B, 0,
    `select account_ban('${A}','spam')`],
  ['staff cannot ban staff',                  'denied', C, 0,
    `select account_ban('${C}','spam')`],
  ['staff bans B',                            'ok',     C, 0,
    `select account_ban('${B}','spam')`],
  ['and B cannot post',                       'denied', B, 0,
    `insert into post(author,body) values ('${B}','{}'::jsonb)`],
  ['nor like anything',                       'denied', B, 0,
    `insert into react(post,actor,kind) values ('${P}','${B}','like')`],
  ['nor follow anybody',                      'denied', B, 0,
    `insert into follow(follower,followed) values ('${B}','${A}')`],
  ['nor report anybody',                      'denied', B, 0,
    `insert into report(actor,post,why) values ('${B}','${P}','spam')`],
  ['nor rename themselves',                   'denied', B, 0,
    `update profile set display='new' where id='${B}'`],
  ['nor upload anything',                     'denied', B, 0,
    `insert into storage.objects(bucket_id,name) values ('post-media','${B}/x.jpg')`],
  /* And the half a freeze must leave alone. 「制作は好きにやらせればいいし、
     sns止められても作りたいやつは作るでしょ」 A language is nobody else's
     business, so it goes on being written -- which is only true because the
     language policies ask has_account() and has_account() says nothing about
     banned_at. */
  ['but B still makes a language',            'ok',     B, 0,
    `insert into language(id,owner,name) values ('${LB}','${B}','Bene')`],
  ['and goes on writing it',                  'ok',     B, 0,
    `update language set name='Benet' where id='${LB}'`],
  ['nor lift it by hand',                     'denied', B, 0,
    `update profile set banned_at=null where id='${B}'`],
  ['nor by asking',                           'denied', B, 0,
    `select account_unban('${B}')`],
  /* Two things a ban must NOT do. Reading is the one that keeps somebody from
     being told nothing at all, and the door marked exit is the one that being
     thrown out of a place is never a reason to lock. */
  ['B can still read the timeline',           'ok',     B, 0,
    `select 1 from post where hidden_at is null`],
  ['B can still leave',                       'ok',     B, 0,
    `select 1 where (select count(*) from pg_proc p
                       join pg_namespace n on n.oid=p.pronamespace
                      where n.nspname='public' and p.proname='account_delete'
                        and p.prosrc not like '%is_member%') = 1`],
  /* And what everybody else is handed about a frozen account's posts. Not
     hidden -- the posts stay readable, and the phone takes them off the
     timeline and leaves them on the account's own page. 「ツイートは自己責任
     で見れるようにする」 A reader has to be able to tell, so it is on the row
     rather than being asked about every author a timeline shows. */
  ['a frozen account\u2019s post says so on the row', 'ok', A, 0,
    `select 1 from post_seen where author='${B}' and author_out`],
  ['and A\u2019s does not',                    'ok',     A, 0,
    `select 1 from post_seen where author='${A}' and not author_out`],
  ['staff lifts it',                          'ok',     C, 0,
    `select account_unban('${B}')`],
  /* A boost and not a like: B liked this post earlier in the file and took
     only the boost back, so a second like is refused by the primary key and
     would read as a ban that never lifted. */
  ['and B writes again',                      'ok',     B, 0,
    `insert into react(post,actor,kind) values ('${P}','${B}','boost')`]
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
  /* A report is about somebody else, so it has to outlive the person who
     wrote it. `actor` cascaded off the profile until account deletion existed
     to fire it, and deleting your own account withdrew every report you had
     ever made -- a third party's record cleared by somebody else leaving.
     Asked of the constraint and not by deleting an account, because what has
     to hold is that the FOREIGN KEY says so; a passing delete with no reports
     in the table would prove nothing. One, and not "none that cascade": a
     table with no foreign key at all would answer none. */
  ['a report outlives whoever wrote it', `
     select count(*) from (select 1 where not exists (
       select 1 from pg_constraint c
         join pg_class t on t.oid = c.conrelid
        where t.relname='report' and c.contype='f' and c.confdeltype='n'
          and c.conkey = array[(select attnum from pg_attribute
                                 where attrelid=t.oid and attname='actor')]
     )) q`, '0'],
  /* A reaction is on or off. An update policy would let a row be turned into
     a different kind, and the primary key would not notice. */
  ['a reaction is never edited', `
     select count(*) from pg_policies where tablename='react' and cmd='UPDATE'`, '0'],
  /* An overwrite is how somebody else's post quietly changes under them. */
  ['a file is never overwritten', `
     select count(*) from pg_policies where tablename='objects' and cmd='UPDATE'`, '0'],
  /* Every one of these is a count that must come back zero, so "the bucket is
     there" has to be asked as "there is no world in which it is missing". */
  /* notices() runs as whoever calls it. `security definer` would make it run
     as its owner, which is past every policy above -- and the one thing it
     does is read four tables about one person. */
  ['what happened to you is read as you', `
     select count(*) from pg_proc where proname='notices' and prosecdef`, '0'],
  /* Row level security says which ROWS may change and has nothing to say
     about which COLUMNS. "You may edit yourself" was also "you may make
     yourself staff" until these two were revoked, and neither a policy nor
     an attempt above can see the difference: the UPDATE is allowed either
     way, and only the column list decides what it carries. */
  ['staff is not something an account gives itself', `
     select count(*) from (select 1 where
       has_column_privilege('authenticated','profile','staff','UPDATE')
       or has_column_privilege('anon','profile','staff','UPDATE')) q`, '0'],
  ['nor lifting your own ban', `
     select count(*) from (select 1 where
       has_column_privilege('authenticated','profile','banned_at','UPDATE')
       or has_column_privilege('anon','profile','banned_at','UPDATE')) q`, '0'],
  /* The split itself, which no attempt above can see going the wrong way: an
     attempt proves what one account may do, and what has to hold here is that
     the two questions stayed two. A has_account() that grew a banned_at line
     would pass every case in this file and would also freeze the making
     side. */
  ['there is a question that asks only for an account', `
     select count(*) from (select 1 where
       (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='has_account'
           and p.prosrc not like '%is_anonymous%'
           and p.prosrc not like '%banned_at%') <> 1) q`, '0'],
  ['and a language asks it rather than the other one', `
     select count(*) from pg_policies
      where tablename='language' and cmd in ('INSERT','UPDATE','DELETE')
        and (coalesce(qual,'')||coalesce(with_check,'')) like '%is_member%'`, '0'],
  /* post_seen runs as its owner and sees every row -- that is what lets it
     hand back a taken-down post with nothing in it. Two things have to hold
     for that to be a wall rather than a door. It must not carry the column
     that says WHY a post went, which is the reports screen's; and the table
     under it must still refuse a hidden row, or the view is beside a door
     rather than in one. The attempts above try that door; this is the shape
     of it. */
  ['a tombstone does not carry the reason', `
     select count(*) from information_schema.columns
      where table_schema='public' and table_name='post_seen'
        and column_name in ('hidden_why')`, '0'],
  ['and the table under it still refuses a hidden post', `
     select count(*) from pg_policies
      where tablename='post' and cmd='SELECT'
        and coalesce(qual,'') not like '%hidden_at%'`, '0'],
  /* What a language is made of is the one thing in this file with no public
     face at all. Every other table has a select policy somebody else passes;
     this one must not, and "nobody has tried the right query yet" is not the
     same statement. */
  ['what a language is made of is nobody else\u2019s', `
     select count(*) from pg_policies
      where tablename='slice' and cmd='SELECT'
        and coalesce(qual,'') not like '%owner = auth.uid()%'`, '0'],
  /* A language belongs to the ACCOUNT. Pointed at profile it could not be
     made until somebody had a handle, which is the one thing the first launch
     does not ask for. */
  ['a language belongs to an account, not to a person', `
     select count(*) from pg_constraint c
      where c.conrelid='language'::regclass and c.contype='f'
        and c.confrelid <> 'auth.users'::regclass`, '0'],
  /* A ban that only the app enforces is a ban that lasts until somebody uses
     something that is not the app. is_member() is the one door every policy
     for something other people see stands behind, which is why it is where
     this goes -- and why the line has to actually be in it. */
  ['a ban is enforced by the server', `
     select count(*) from (select 1 where
       (select count(*) from pg_proc where proname='is_member'
          and prosrc like '%banned_at%') <> 1) q`, '0'],
  ['nor is putting your own post back up', `
     select count(*) from (select 1 where
       has_column_privilege('authenticated','post','hidden_at','UPDATE')
       or has_column_privilege('anon','post','hidden_at','UPDATE')) q`, '0'],
  /* Both halves, together: a definer function that forgot to ask is_staff()
     is every account holding the moderator's rights, and it would pass every
     attempt above that expects a refusal only because nobody had called it. */
  ['taking a post down asks who is asking', `
     select count(*) from (select 1 where
       (select count(*) from pg_proc where proname in ('post_hide','post_show')
          and prosecdef and prosrc like '%is_staff()%') <> 2) q`, '0'],
  /* Counting is the same shape and gets the same pair of claims. The second
     is the one worth holding: the count exists as a definer function SO THAT
     `language_read` would not have to grow is_staff() -- which would have
     handed staff the contents of every language nobody has published. If a
     later session takes the easy road, this goes red. */
  ['counting asks who is asking too', `
     select count(*) from (select 1 where
       (select count(*) from pg_proc where proname='admin_counts'
          and prosecdef and prosrc like '%is_admin()%') <> 1) q`, '0'],
  /* The three that hand out and take back what is_staff() answers. All of
     them definer, all of them asking is_admin() inside -- one that forgot
     would be every account holding the right to appoint moderators, and it
     would pass every attempt above that expects a refusal, because nobody had
     called it yet. */
  ['making somebody staff asks who is asking', `
     select count(*) from (select 1 where
       (select count(*) from pg_proc where proname in ('staff_add','staff_drop')
          and prosecdef and prosrc like '%is_admin()%') <> 2) q`, '0'],
  /* And the one that cannot be undone from inside the app. Three words in
     staff_drop, and nothing else in this file would notice them going.

     The WHERE clause and not just the words: the first version of this line
     asked for `%not admin%`, which the function's own `raise exception 'not
     admin'` answers -- so it stayed green with the guard taken out, and the
     only thing that caught it was the attempt above. A claim that passes for
     the wrong reason is worse than no claim, because it is counted. */
  ['and the one above staff cannot be unmade', `
     select count(*) from (select 1 where
       (select count(*) from pg_proc where proname='staff_drop'
          and prosrc like '%where handle = h and not admin%') <> 1) q`, '0'],
  /* Said the same way `staff` is said, one line down in this list: a column
     nobody signs in as may write is the only reason the functions above are
     the only road to it. */
  ['nor is the one above staff something an account gives itself', `
     select count(*) from (select 1 where
       has_column_privilege('authenticated','profile','admin','UPDATE')
       or has_column_privilege('anon','profile','admin','UPDATE')) q`, '0'],
  /* The first one is written down here rather than remembered by a person.
     Both halves: the trigger for a row that arrives later, and something in
     the file that catches a row already there. */
  ['the first one is in the file and not in somebody’s memory', `
     select count(*) from (select 1 where
       (select count(*) from pg_trigger where tgname='profile_first'
          and not tgisinternal) <> 1) q`, '0'],
  /* And the row every new account is given. A trigger, because www/ is a
     suggestion and this one may not be declined by running a changed copy. */
  ['and the follow is written by the server', `
     select count(*) from (select 1 where
       (select count(*) from pg_trigger where tgname='profile_follows'
          and not tgisinternal) <> 1) q`, '0'],
  /* The half that makes it a follow and not a fixture. If a later session
     narrows follow_drop to "anything but that one", this goes red. */
  ['and it can be taken off like any other', `
     select count(*) from pg_policies
      where tablename='follow' and policyname='follow_drop'
        and qual like '%lingua%'`, '0'],
  ['and it did not open the unpublished languages', `
     select count(*) from pg_policies
      where tablename='language' and policyname='language_read'
        and qual like '%is_staff%'`, '0'],
  ['a report is never edited or withdrawn', `
     select count(*) from pg_policies
      where tablename='report' and cmd in ('UPDATE','DELETE')`, '0'],
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

/* TWICE. The file says at its head that the whole of it can be run again, any
   number of times, and that claim is the reason it is safe to paste into a
   SQL editor without remembering what was pasted last time. A `create table`
   without `if not exists`, or a policy made without being dropped first,
   turns the second pass red here rather than in somebody's project. */
const SCHEMA_SQL = fs.readFileSync(SCHEMA, 'utf8');
const sql = [
  GROUND,
  SCHEMA_SQL,
  SCHEMA_SQL,
  HARNESS,
  'begin;',
  /* The only seeding there is. Everything else below is done BY somebody,
     through a policy, in the order a real account would do it -- a profile
     before a language, a language before a post -- because a row put here by
     the owner of the table would be a row no policy ever had to allow. */
  `insert into auth.users(id) values (${q(A)}),(${q(B)}),(${q(C)}),(${q(D)}),(${q(E)}),(${q(F)});`,
  /* And one row that IS put here by the owner of the table, which the
     paragraph above says nothing else is. That is the claim being tested: no
     policy in schema.sql makes anybody staff, and the column is revoked from
     every role the app signs in as, so there is no other way to arrive at one.
     A staff account that could be made through a policy would be the bug. */
  `insert into profile(id,handle,staff) values (${q(C)},'mod',true);`,
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
