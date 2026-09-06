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
/* Three more who have not written themselves in yet, and one each rather
   than one reused: a profile is keyed on the account, so the second attempt
   by somebody who got through on the first is refused by the primary key.
   That is a denial for the wrong reason, and it reads exactly like the
   right one. */
const G4='a0000000-0000-4000-8000-0000000000a4';   /* arrives with a line about themselves */
const P2='c0000000-0000-4000-8000-0000000000b2';  /* two more of A's posts */
const P3='c0000000-0000-4000-8000-0000000000b3';
const G1='a0000000-0000-4000-8000-0000000000a1';   /* tries to arrive holding admin */
const G2='a0000000-0000-4000-8000-0000000000a2';   /* tries to arrive holding staff */
const G3='a0000000-0000-4000-8000-0000000000a3';   /* tries to arrive already banned */
/* Three about the fortnight the @ may not be changed twice inside.
   One each, and none of them reused from above, because what is being asked
   of them is a HISTORY -- when this account last renamed itself -- and an
   account that has been renamed by an earlier case is carrying an answer the
   case below did not set. */
const N1 = 'a0000000-0000-4000-8000-0000000000e1';  /* has never renamed */
const N2 = 'a0000000-0000-4000-8000-0000000000e2';  /* renamed fifteen days ago */
const N3 = 'a0000000-0000-4000-8000-0000000000e3';  /* renamed thirteen days ago */
/* And somebody who starts AFTER that one exists, which is the only way to
   watch what a new account is given. A and B are made before it on purpose:
   they are everybody who was already here, and nothing is written onto them. */
const F = 'f0000000-0000-4000-8000-00000000000f';   /* somebody starting today */
/* Two drafts. A's, which B tries every way there is to reach, and one more
   for the two attempts that are about a row ARRIVING rather than a row that
   is already there -- reusing A's id would be refused by the primary key,
   and that reads exactly like the policy refusing it. */
const DR = 'd0000000-0000-4000-8000-0000000000d1';  /* what A wrote and did not send */
const DR2= 'd0000000-0000-4000-8000-0000000000d2';  /* the one B tries to plant */
/* Six posts to put in an order. B holds them all so that F is free to react
   to them -- notices() leaves out what you did to your own -- and because
   they are seeded after A has asked to be deleted. */
const H1 = 'a0000000-0000-4000-8000-0000000000f1';  /* one boost  = 3 */
const H2 = 'a0000000-0000-4000-8000-0000000000f2';  /* one answer = 5 */
const H3 = 'a0000000-0000-4000-8000-0000000000f3';  /* one like   = 1 */
const H4 = 'a0000000-0000-4000-8000-0000000000f4';  /* nothing, and older */
const H5 = 'a0000000-0000-4000-8000-0000000000f5';  /* older than the window */
const H3b= 'a0000000-0000-4000-8000-0000000000f6';  /* nothing, and newer than H4 */
/* A search A starred. What somebody looks for is as much about them as
   what they write, so B tries every way to it that there is. */
const SV = 'c0000000-0000-4000-8000-0000000000c1';  /* A\u2019s starred search */
const SV2= 'c0000000-0000-4000-8000-0000000000c2';  /* the one B tries to plant */
const RC = 'c0000000-0000-4000-8000-0000000000d1';  /* A’s search history */
const RC2= 'c0000000-0000-4000-8000-0000000000d2';  /* the one B tries to plant */
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
  /* THE @ AND NOT A COLUMN. 「@で決めたんじゃないの？」 OWNER 2026-09-03 --
     is_admin() reads the handle now, so this asks the function rather than a
     flag beside it. */
  ['and is the one above that',               'ok',     E, 0,
    `select 1 where is_admin()`],
  ['B is neither',                            'denied', B, 0,
    `select 1 from profile where id='${B}' and staff`],
  ['nor does B answer the question',          'denied', B, 0,
    `select 1 where is_admin()`],
  /* AND B CANNOT TAKE THE NAME. `handle` is in the UPDATE grant -- renaming
     yourself is what that grant is for -- so with the @ deciding, the rename
     is the road, and profile_rename() is what closes it. Uniqueness alone
     would only hold while the row is there. */
  ['B cannot rename itself to the one above staff', 'denied', B, 0,
    `update profile set handle='lingua' where id='${B}'`],
  ['and is still not it',                     'denied', B, 0,
    `select 1 where is_admin()`],
  /* --- AND NOT TWICE IN A FORTNIGHT -------------------------------------
     「ユーザーネームは14日に1度しか変更できないようにしたい」 OWNER 2026-09-03.
     The @ is what people call each other by and it freezes into other
     people's posts, so a name that can be swapped every morning is a reply
     addressed to nobody.

     Asked here rather than on a screen because the screen is not where it is
     decided: `handle` is in the UPDATE grant, so PATCH /rest/v1/profile is a
     request anybody can make with the app closed. Four attempts, and three of
     them are ways of getting this wrong quietly.

     THE FIRST ONE IS NOT A CHANGE. `handle_at` is null on every row that
     existed before the column did and on every account made since -- picking
     the @ when the account is made is not changing it -- so a rule that
     treated null as "long ago, and no" would be the rule "nobody may ever be
     called anything else", and every account in the database would already
     be under it. N1 makes its own profile through the same policy everybody
     else does, so what is being read here is what a real account starts
     holding, not something seeded. */
  ['somebody who has never renamed writes themselves in', 'ok', N1, 0,
    `insert into profile(id,handle) values ('${N1}','onceo')`],
  ['and the first rename goes through',       'ok',     N1, 0,
    `update profile set handle='oncen' where id='${N1}'`],
  /* And the second, a moment later, does not. Everything above lands in one
     transaction sharing one now(), so "a moment later" is exact rather than
     approximately soon. */
  ['but the second one does not',             'denied', N1, 0,
    `update profile set handle='oncex' where id='${N1}'`],
  /* And it did not half-happen. A BEFORE trigger that raised after writing
     would leave the row renamed and the person refused, which reads as a
     refusal from outside and is the opposite of one. */
  ['and the name did not move',               'ok',     N1, 0,
    `select 1 from profile where id='${N1}' and handle='oncen'`],
  /* And the account can SEE when it was, which is the half the screen needs.
     The column is the server's to write and everybody's to read -- a field
     that greys out with nothing to read off it cannot say when it opens
     again, and that sentence is what the narrowing of 2026-08-22 asks for
     wherever the app has taken something away. */
  ['and can read when that was',              'ok',     N1, 0,
    `select 1 from profile where id='${N1}' and handle_at is not null`],
  /* Both sides of the line, because a comparison written the wrong way round
     passes every test that only ever asks one side of it. Thirteen days is
     inside the fortnight and fifteen is past it; these two are seeded with
     the ages, for the reason written where they are seeded. */
  ['thirteen days is not long enough',        'denied', N3, 0,
    `update profile set handle='threen' where id='${N3}'`],
  /* AND BEING PAST IT BUYS NOTHING ELSE. The fortnight is a second sentence
     in the trigger that already held the reserved name, and the thing to be
     afraid of when a function grows a second sentence is that it becomes the
     only one. N2 is fifteen days clear, so the fortnight lets this through
     and the reserved name is the only thing left that can refuse it. Asked
     BEFORE the rename below, because afterwards N2 is inside the fortnight
     and would be refused for the other reason -- which reads identically. */
  ['and being clear of it does not buy the reserved name', 'denied', N2, 0,
    `update profile set handle='lingua' where id='${N2}'`],
  ['fifteen days is long enough',             'ok',     N2, 0,
    `update profile set handle='twon' where id='${N2}'`],
  /* --- nor on the way in, which is a different statement -----------------
     The two lines above are UPDATEs, and revoking UPDATE on a column says
     nothing about INSERT: they are separate grants. It only matters where the
     row is written by the account it is about, and profile is exactly that --
     `profile_make` is how somebody writes THEMSELVES into existence, so the
     first write of the row is theirs and one extra field in it was the whole
     of the attack. Anybody who had not made their profile yet could arrive
     holding admin, and is_admin() reads that column. */
  ['nor by writing it in on the way in',      'denied', G1, 0,
    `insert into profile(id,handle,admin) values ('${G1}','probe1',true)`],
  ['nor staff on the way in',                 'denied', G2, 0,
    `insert into profile(id,handle,staff) values ('${G2}','probe2',true)`],
  ['nor a ban on the way in',                 'denied', G3, 0,
    `insert into profile(id,handle,banned_at) values ('${G3}','probe3',now())`],
  /* And the same statement about a post. schema.sql says over hidden_at that
     "nobody may set these but the two functions at the foot of this file";
     a post arriving with it set reads as taken down by staff, carrying a
     reason its own author wrote, and post_show() is staff's -- so it could
     not be put back by the person who did it either. */
  ['nor does a post arrive already taken down', 'denied', A, 0,
    `insert into post(author,body,hidden_at,hidden_why) values ('${A}','{}'::jsonb,now(),'x')`],
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

  /* --- an account with no name on it --------------------------------------
     There used to be one on every phone: the app signed itself in anonymously
     before the first frame, and a language was made by somebody who had not
     said who they were and might never say. **OWNER DECISION 2026-08-26 took
     that out** -- \u300c\u8a00\u8a9e\u306f\u30a2\u30ab\u30a6\u30f3\u30c8\u306a\u3044\u3068\u4f5c\u308c\u306a\u3044\u3067\u3059\u300d\u300c\u30ed\u30b0\u30a4\u30f3\u3057\u305f\u4eba\u3057\u304b
     \u66f8\u3051\u306a\u3044\u3051\u3069\u300d -- and the whole reason has_account() existed beside
     is_member() went with it.

     So D is the other direction now: a session that IS anonymous, on a phone
     that has been running since before that day, may write nothing at all. It
     is still the only account in this file that never gets a profile row,
     which is why language.owner points at auth.users rather than at profile --
     a row it could not have had.

     Every line of it is one word. There is nothing an account with no name on
     it may do. */
  ['an anonymous account cannot make a language', 'denied', D, 1,
    `insert into language(id,owner,name) values ('${LD}','${D}','Nen')`],
  ['nor put a slice on anybody\u2019s',       'denied', D, 1,
    `insert into slice(language,kind,body) values ('${L}','words','[1]')`],
  ['nor post',                                'denied', D, 1,
    `insert into post(author,body) values ('${D}','{}'::jsonb)`],
  ['nor give itself a handle',                'denied', D, 1,
    `insert into profile(id,handle) values ('${D}','nobody')`],
  ['nor follow anybody',                      'denied', D, 1,
    `insert into follow(follower,followed) values ('${D}','${A}')`],
  ['nor publish anything',                    'denied', D, 1,
    `insert into publication(language,actor,kind,digest)
       values ('${L}','${D}','language','sha')`],
  ['nor own a language of A\u2019s',          'denied', D, 1,
    `insert into language(owner,name) values ('${A}','forged')`],
  ['and the language it could not make is not there', 'denied', B, 0,
    `select 1 from language where id='${LD}'`],

  /* A second language, unpublished, for the slice questions below. L is
     PUBLISHED by this point and a published one answers the reading half
     differently, so the two cannot be the same row. It used to be D's; D
     cannot have one now, so it is A's. */
  ['A makes a second one and leaves it unpublished', 'ok', A, 0,
    `insert into language(id,owner,name) values ('${LD}','${A}','Nen')`],
  ['and nobody else sees it',                 'denied', B, 0,
    `select 1 from language where id='${LD}'`],
  /* And what the language is MADE of. A slice is the dictionary, the
     alphabet, the keyboard -- the whole of what somebody spends months on.
     LD is A's and is NOT published, so none of it is anybody else's, and
     that is the half that may never move. */
  ['and puts its dictionary in it',           'ok',     A, 0,
    `insert into slice(language,kind,body) values ('${LD}','words','[1]')`],
  /* An ARTICLE on the unpublished one, so that the two claims below are asked
     of a row that is really there. Without it they select over nothing and
     pass without touching the policy. */
  ['and an article on it',                    'ok',     A, 0,
    `insert into slice(language,kind,body) values ('${LD}','wld','{"where":"a valley"}')`],
  ['and reads it back',                       'ok',     A, 0,
    `select 1 from slice where language='${LD}' and kind='words'`],
  ['and writes over it',                      'ok',     A, 0,
    `update slice set body='[1,2]', no=2 where language='${LD}' and kind='words'`],
  ['B cannot read it',                        'denied', B, 0,
    `select 1 from slice where language='${LD}'`],
  /* THE ONE THAT MAY NEVER MOVE. \u300c\u975e\u516c\u958b\u306b\u3057\u305f\u3089\u975e\u516c\u958b\u300d -- an unpublished
     language's article is not readable by anybody else, and the About page is
     exactly what somebody would come for. */
  ['nor the article of a language kept private', 'denied', B, 0,
    `select 1 from slice where language='${LD}' and kind='wld'`],
  ['nor its letters, nor its keyboard',       'denied', B, 0,
    `select 1 from slice where language='${LD}' and kind in ('letters','kb','snd','script')`],
  ['B cannot write into it',                  'denied', B, 0,
    `insert into slice(language,kind,body) values ('${LD}','letters','[]')`],
  ['B cannot rewrite it',                     'denied', B, 0,
    `update slice set body='[]' where language='${LD}' and kind='words'`],
  ['B cannot delete it',                      'denied', B, 0,
    `delete from slice where language='${LD}'`],
  ['nor can somebody with no account at all',  'denied', B, 1,
    `select 1 from slice where language='${LD}'`],
  ['nor read a private article with no account', 'denied', B, 1,
    `select 1 from slice where language='${LD}' and kind='wld'`],

  /* L is A's and it is PUBLISHED by this point in the file.
     ---------------------------------------------------------------------
     \u300c\u3053\u306e\u8a00\u8a9e\u306b\u3064\u3044\u3066\u306f\u516c\u958b\u3057\u305f\u3089\u516c\u958b\u3001\u975e\u516c\u958b\u306b\u3057\u305f\u3089\u975e\u516c\u958b\u3060\u3051\u3069\u305d\u308c\u4ee5\u5916\u306b
       \u3042\u3093\u306e\u304b\uff1f\u300d OWNER 2026-08-28. Two states and no third.

     IT NEEDS REAL ROWS, and until 2026-08-28 it had none. `L` carried no
     slice at all, so the claim that used to stand here -- "B cannot read a
     published language's slices" -- was a select over an empty table. It
     passed on the day it was written, it passed after the policy it was
     about had been rewritten, and it never once touched the policy. A claim
     that passes for the wrong reason is the thing this file exists to
     catch, and this one was that for as long as it existed. */
  ['A puts the article on the published one', 'ok',     A, 0,
    `insert into slice(language,kind,body) values ('${L}','wld','{"where":"a valley"}')`],
  ['and its letters',                         'ok',     A, 0,
    `insert into slice(language,kind,body) values ('${L}','letters','[1]')`],
  ['and its dictionary',                      'ok',     A, 0,
    `insert into slice(language,kind,body) values ('${L}','words','[1]')`],
  ['and its grammar',                         'ok',     A, 0,
    `insert into slice(language,kind,body) values ('${L}','phases','[2]')`],
  /* Published is published: the five the About page reads are readable, and
     reading needs no account, the same as a post and a profile. */
  ['B reads a published language\u2019s article', 'ok', B, 0,
    `select 1 from slice where language='${L}' and kind='wld'`],
  ['and its letters',                         'ok',     B, 0,
    `select 1 from slice where language='${L}' and kind='letters'`],
  ['and so does somebody with no account at all', 'ok', B, 1,
    `select 1 from slice where language='${L}' and kind='wld'`],
  /* AND THE DICTIONARY IS NOT THE PAGE. \u300c\u8a00\u8a9e\u30da\u30fc\u30b8\u516c\u958b\u3068\u5358\u8a9e\u3084\u6587\u5b57\u306edl\u53ef\u80fd\u306f
     \u5225\u3060\u3057\u300d OWNER -- being allowed to READ somebody's page and being handed
     the months of work behind it are two questions, and publishing the page
     answers only the first. */
  ['but not its dictionary',                  'denied', B, 0,
    `select 1 from slice where language='${L}' and kind='words'`],
  ['nor its grammar',                         'denied', B, 0,
    `select 1 from slice where language='${L}' and kind='phases'`],
  ['nor the dictionary with no account at all', 'denied', B, 1,
    `select 1 from slice where language='${L}' and kind='words'`],
  /* Publishing is a page being readable and never a way in. */
  ['B cannot put a slice on A\u2019s language', 'denied', B, 0,
    `insert into slice(language,kind,body) values ('${L}','lines','[]')`],
  ['nor rewrite the article it can read',     'denied', B, 0,
    `update slice set body='{}' where language='${L}' and kind='wld'`],
  ['nor delete it',                           'denied', B, 0,
    `delete from slice where language='${L}' and kind='wld'`],

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

  /* --- what the people you follow passed on ------------------------------
     A boost was a row in `react` and did nothing to anybody's timeline: the
     followed feed was `author = the people you follow` and a boost is not a
     post. feed_fo() is the two questions as one list.

     A follows B here; B has boosted A's post P further up (and taken it back
     one line later, so it is put on again for this). */
  ['A follows B for the timeline',            'ok',     A, 0,
    `insert into follow(follower,followed) values ('${A}','${B}')`],
  ['B boosts A\u2019s post',                  'ok',     B, 0,
    `insert into react(post,actor,kind) values ('${P}','${B}','boost')`],
  ['what B passed on reaches A',              'ok',     A, 0,
    `select 1 from feed_fo(50, null) where id='${P}'`],
  ['and it says who passed it on',            'ok',     A, 0,
    `select 1 from feed_fo(50, null) where id='${P}' and by='${B}'`],
  /* Dated by the BOOST and not by the post -- a five year old thing passed on
     this morning belongs at this morning. Asserted as equality against the
     react row, because everything in this file runs in ONE transaction and
     now() is transaction time: the post and the boost share a timestamp here,
     so a check written as `at_key > the post's created_at` cannot tell the
     two apart and was green for the wrong reason. What is held is that
     at_key IS the boost's row. */
  ['and it is dated by the passing on',       'ok',     A, 0,
    `select 1 from feed_fo(50, null) f
       where f.id='${P}' and f.at_key = (select r.created_at from react r
                                          where r.post='${P}' and r.actor='${B}'
                                            and r.kind='boost')`],
  /* Somebody who follows nobody is handed nobody's timeline, which is what an
     empty following feed IS. */
  ['C follows nobody and gets nothing',       'denied', C, 0,
    `select 1 from feed_fo(50, null)`],
  ['B takes the boost back',                  'ok',     B, 0,
    `delete from react where post='${P}' and actor='${B}' and kind='boost'`],
  ['and it stops reaching A',                 'denied', A, 0,
    `select 1 from feed_fo(50, null) where id='${P}' and by='${B}'`],
  ['A unfollows B again',                     'ok',     A, 0,
    `delete from follow where follower='${A}' and followed='${B}'`],

  /* --- how big a published language is, without handing it over ---------
     「言語の詳細は？」OWNER 2026-09-01. A person's page could say the NAME of
     their language and nothing else, so there was nowhere to go from it.

     The claim with teeth is the SHUT half: a count is not a download.
     `language_seen` carries how many words there are and `slice_read` still
     refuses the words themselves -- 「言語ページ公開と単語や文字のdl可能は
     別だし」. Both are asked, because a view runs with the definer's rights
     and would otherwise be a way round every policy in this file. */
  ['A sees their own either way',             'ok',     A, 0,
    `select 1 from language_seen where id='${L}'`],
  /* L was published further up this file (line ~223), which is why this is
     not「A publishes it」here: writing that again would be a claim about a
     state this block did not make. The unpublished half is asked below,
     about B's, which nobody has published. */
  ['anybody may read a published one',        'ok',     B, 0,
    `select 1 from language_seen where id='${L}'`],
  ['and somebody with no account may too',    'ok',     B, 1,
    `select 1 from language_seen where id='${L}'`],
  ['it says how many words there are',        'ok',     B, 0,
    `select 1 from language_seen where id='${L}' and nwords = 1`],
  ['and how many letters',                    'ok',     B, 0,
    `select 1 from language_seen where id='${L}' and nletters = 1`],
  ['and when it was published',               'ok',     B, 0,
    `select 1 from language_seen where id='${L}' and published_at is not null`],
  /* AND THE WORDS THEMSELVES STAY SHUT. A count is a number about the
     language; the dictionary is the months of work behind it. */
  ['but the dictionary is still nobody else\u2019s', 'denied', B, 0,
    `select 1 from slice where language='${L}' and kind='words'`],
  ['nor the grammar',                         'denied', B, 0,
    `select 1 from slice where language='${L}' and kind='gram2'`],
  /* A slice that was never written counts 0 rather than throwing -- a page
     that cannot draw because a count failed is worse than a zero. */
  /* A slice nobody ever wrote, and one holding something this does not
     understand, both count 0 rather than throwing or answering nothing.
     「Empty」 and 「broken」 are different states and neither is an error the
     page can do anything with. */
  ['a slice never written counts none',       'ok',     B, 0,
    `select 1 from language_seen where id='${L}'
       and slice_count(null) = 0 and slice_count('not json') = 0
       and slice_count('[]') = 0 and slice_count('[1,2,3]') = 3`],
  ['and an unpublished one is still hidden',  'denied', B, 0,
    `select 1 from language_seen where owner='${B}' and published_at is null`],

  /* --- and the two numbers a profile is made of --------------------------
     They were 0 on every page for everybody: `follow` was read back only
     about YOURSELF. profile_seen counts them beside the row.

     The state is made here rather than borrowed: A and B are written in at
     the top of this file and were given no follows, and every follow made
     further up is taken away again by the cases that test unfollowing. */
  ['nobody follows F yet',                    'ok',     A, 0,
    `select 1 from profile_seen where id='${F}' and fr = 0 and fo = 0`],
  ['A follows F',                             'ok',     A, 0,
    `insert into follow(follower,followed) values ('${A}','${F}')`],
  ['and F\u2019s page says one follows them', 'ok',     A, 0,
    `select 1 from profile_seen where id='${F}' and fr = 1`],
  ['and somebody with no account sees it',    'ok',     B, 1,
    `select 1 from profile_seen where id='${F}' and fr = 1`],
  ['F is still following nobody',             'ok',     A, 0,
    `select 1 from profile_seen where id='${F}' and fo = 0`],
  ['A unfollows F',                           'ok',     A, 0,
    `delete from follow where follower='${A}' and followed='${F}'`],
  ['and the number goes back',                'ok',     A, 0,
    `select 1 from profile_seen where id='${F}' and fr = 0`],
  /* And it is not a second way at what profile keeps back. */
  ['profile_seen hands out no staff flag',    'denied', B, 0,
    `select 1 from profile_seen where id='${E}' and staff`],

  /* --- and the count comes BACK, which is the half that was missing -------
     「当たり前だけどsnsとして機能してない」OWNER 2026-09-01. Liking was
     written and there was no GET of /rest/v1/react anywhere in the app, so a
     count went up on the phone that pressed it and nowhere else.

     post_seen carries it now. The state here is exactly one like, by B, and
     no boost -- B put one on two lines up and took it back one line up. */
  ['the like is counted for anybody reading',  'ok',     A, 0,
    `select 1 from post_seen where id='${P}' and likes = 1`],
  ['and for somebody with no account',        'ok',     B, 1,
    `select 1 from post_seen where id='${P}' and likes = 1`],
  ['the boost that was taken back is not',    'ok',     A, 0,
    `select 1 from post_seen where id='${P}' and boosts = 0`],
  /* Whether the READER is one of them, which the count cannot answer. */
  ['B is told that B liked it',               'ok',     B, 0,
    `select 1 from post_seen where id='${P}' and i_like`],
  ['A is told that A did not',                'ok',     A, 0,
    `select 1 from post_seen where id='${P}' and not i_like`],
  /* NOT PROBED HERE, and said out loud so a green run is not read as more
     than it is: a request with NO SESSION AT ALL. `chk()` takes `sub` as a
     uuid and every "no account" case in this file is an ANONYMOUS session --
     `is_anonymous` true, `sub` still set -- so auth.uid() is never null in
     any of them. `i_like` is `actor = auth.uid()`, which for a null uid is
     false for every row, but that is read off the SQL rather than watched
     happening. docs/BACKLOG.md. */
  /* And it does not become a way to read who. A count is public on a
     timeline; the list of names behind it is not this view's to hand out. */
  ['B cannot read the likes off another\u2019s', 'denied', B, 0,
    `select 1 from react where post='${P}' and actor='${A}'`],

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
  /* And the third answer: there was nothing wrong with it.
     「通報で問題なかったらその通報が消せるようにしてほしい」 OWNER 2026-09-05.
     A function and not a delete policy, so it is is_staff() inside that
     decides -- which is what these three ask. B reads no report at all, so
     the row it names comes back null and the call is refused for being
     nobody's to make rather than for naming nothing. */
  ['B cannot drop a report',                  'denied', B, 0,
    `select report_drop((select min(id) from report))`],
  ['nor can somebody with no account',        'denied', B, 1,
    `select report_drop((select min(id) from report))`],
  ['staff drops the one that was about nothing', 'ok',  C, 0,
    `select report_drop((select id from report where who='${A}'))`],
  ['and that report is gone',                 'denied', C, 0,
    `select 1 from report where who='${A}'`],
  /* And nothing else went with it. The report about the POST is a second row
     by the same author about the same person, so a delete reaching too far
     takes it -- which is the only way this can be wrong and look right. */
  ['and the other report is still there',     'ok',     C, 0,
    `select 1 from report where post='${P}'`],
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
  /* --- and whoever is on that list is Pro --------------------------------
     「管理の画面でスタッフ設定を@でできるでしょ？そこに記載されてる人だけ
     ずっとプロに」 OWNER 2026-09-05. Being staff is the whole of it: no plan
     row was written by anybody here, so the row can only have come from
     becoming staff. */
  ['and B is Pro because of it',              'ok',     B, 0,
    `select 1 from plan where id='${B}' and plan='pro'`],
  /* And the half a screen cannot hold. plan_edit lets an account write its
     own row, so the app -- or a PATCH sent with the app closed -- can set it
     to free, and free is what it would be from then on if this were held
     anywhere but where the row lands. The write is ALLOWED and the row does
     not move, which is why the two are asked separately: a refusal here would
     be a screen saying no, and what is wanted is a tier that does not budge. */
  ['and setting it back to free is allowed',  'ok',     B, 0,
    `update plan set plan='free' where id='${B}'`],
  ['and it is still Pro afterwards',          'ok',     B, 0,
    `select 1 from plan where id='${B}' and plan='pro'`],
  /* And nobody else was swept up in it. A trigger that made every plan row
     pro would pass all three above. */
  ['somebody who is not staff writes free',   'ok',     F, 0,
    `insert into plan(id,plan) values ('${F}','free')`],
  ['and it stays free',                       'ok',     F, 0,
    `select 1 from plan where id='${F}' and plan='free'`],
  ['and can take it away again',              'ok',     E, 0,
    `select staff_drop('iri')`],
  ['and B is not staff any more',             'denied', E, 0,
    `select 1 from profile where handle='iri' and staff`],
  /* --- and a handle nobody has says so ------------------------------------
     「何も出ない。勝手に＠の中が消える。追加されてない」 OWNER 2026-09-05. An
     UPDATE that matches no row is a statement that succeeded, so the screen
     emptied its field and reloaded the same list -- a name nobody has looked
     exactly like a name that had just gone on. It raises now, and the second
     claim is the reason the match is lower() on both sides: `handle` is lower
     case by the check constraint, so a capital typed into the field is a
     person typing a name rather than a person getting it wrong. */
  ['a handle nobody has is refused',          'denied', E, 0,
    `select staff_add('nobodyhasthis')`],
  ['and nobody was made staff by it',         'denied', E, 0,
    `select 1 from profile where staff and handle='nobodyhasthis'`],
  ['a handle typed with capitals still goes on', 'ok',   E, 0,
    `select staff_add('IRI')`],
  ['and B is staff again',                    'ok',     E, 0,
    `select 1 from profile where handle='iri' and staff`],
  /* And put back where the claims above found it. The rows here are one
     database read in order, so a claim that leaves somebody staff is every
     later claim asking its question of a different person. */
  ['and comes off again',                     'ok',     E, 0,
    `select staff_drop('iri')`],
  ['and B is not staff after that',           'denied', E, 0,
    `select 1 from profile where handle='iri' and staff`],
  ['B cannot take staff off anybody',         'denied', B, 0,
    `select staff_drop('mod')`],
  /* The one that cannot be undone from inside the app. The call is allowed
     and does nothing, which is the point -- an error here would be a screen
     saying no, and what is wanted is a row that does not move. */
  ['the one above staff cannot be taken off it', 'ok', E, 0,
    `select staff_drop('lingua')`],
  ['and is still both after trying',          'ok',     E, 0,
    `select 1 from profile where handle='lingua' and staff`],
  ['and still answers the question',          'ok',     E, 0,
    `select 1 where is_admin()`],
  /* NOR CAN THE ONE ABOVE STAFF GIVE THE NAME AWAY. An owner who renamed
     themselves would be an owner with no screen left to fix it from, and the
     name would be free for whoever asked next. */
  ['the one above staff cannot rename itself', 'denied', E, 0,
    `update profile set handle='ayaa' where id='${E}'`],
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
  /* And the language, which used to be the half a freeze left alone.
     「制作は好きにやらせればいいし、sns止められても作りたいやつは作るでしょ」 was
     true while a language was nobody else's business and the language policies
     asked has_account(), which said nothing about banned_at.
     **OWNER DECISION 2026-08-26 replaced it**, asked directly: a frozen account
     may not write its language either. They ask is_member() now, and
     is_member() is where banned_at lives. */
  ['nor make a language any more',            'denied', B, 0,
    `insert into language(id,owner,name) values ('${LB}','${B}','Bene')`],
  ['nor write the one they had',              'denied', B, 0,
    `update language set name='Benet' where id='${L}'`],
  ['nor put a slice in it',                   'denied', B, 0,
    `insert into slice(language,kind,body) values ('${L}','words','[]')`],
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
    `insert into react(post,actor,kind) values ('${P}','${B}','boost')`],

  /* --- and what a notice is, now that it is one row per thing -------------
     「同じ投稿のいいねとかは X みたいにまとめていい」 OWNER 2026-08-28.
     Folded on the SERVER, so that fifty rows are fifty things that happened
     rather than fifty rows that become twenty on the phone.

     B has liked P further up this file and F has not, so F liking it is the
     second person on one post. The claim is not "two likes exist" -- it is
     that A is handed ONE row for them, carrying the number two. */
  /* A minute later, and said out loud: every row this file writes lands in
     ONE transaction, so `now()` is the same instant for all of them and
     "newest" would otherwise be a tie the planner breaks. */
  ['F likes the same post B liked',           'ok',     F, 0,
    `insert into react(post,actor,kind,created_at)
          values ('${P}','${F}','like', now() + interval '1 minute')`],
  ['two people liking one post is ONE notice', 'ok',    A, 0,
    `select 1 from (select count(*) c from notices(50)
                     where kind='like' and post='${P}') q where q.c = 1`],
  ['and it says how many',                    'ok',     A, 0,
    `select 1 from notices(50) where kind='like' and post='${P}' and n = 2`],
  /* The newest is the one the row is named after, and the other is under
     `more`. Both halves: a row that named the OLDEST would read as the wrong
     person having just done it. */
  ['named after whoever did it last',         'ok',     A, 0,
    `select 1 from notices(50) where kind='like' and post='${P}'
       and hd = (select handle from profile where id='${F}')`],
  ['and the one before them is carried too',  'ok',     A, 0,
    `select 1 from notices(50) where kind='like' and post='${P}'
       and more @> jsonb_build_array(jsonb_build_object(
             'hd', (select handle from profile where id='${B}')))`],
  /* And nobody is dropped on the way: both people are named across the row,
     one as the row's own name and the rest under `more`. A fold that kept
     only the newest would pass both lines above and still lose somebody. */
  ['and nobody is lost between the two',      'ok',     A, 0,
    `select 1 from notices(50) where kind='like' and post='${P}'
       and (jsonb_build_array(jsonb_build_object('hd', hd)) || more)
           @> jsonb_build_array(
                jsonb_build_object('hd', (select handle from profile where id='${B}')),
                jsonb_build_object('hd', (select handle from profile where id='${F}')))`],
  /* A thing one person did is still a row, and says one. A fold that only
     worked when there were two would be a fold that hid single notices. */
  ['one person is a notice that says one',    'ok',     A, 0,
    `select 1 from notices(50) where kind='boost' and post='${P}' and n = 1`],

  /* --- and the OTHER way of being the same notice ------------------------
     The owner gave two shapes and the list only ever made one of them:

       several people, one post   -> 「A と B がいいねしました」   (above)
       one person, several posts  -> 「A が2件にいいねしました」   (here)

     notices() grouped by (kind, post) only, so ONE person liking two of your
     posts came out as TWO rows saying the same name twice.

     `n` and `np` are two numbers: how many PEOPLE the row is about, and how
     many POSTS. A screen needs both to choose its sentence. */
  ['A writes two more posts',                 'ok',     A, 0,
    `insert into post(id,author,body) values ('${P2}','${A}','{}'::jsonb),
                                             ('${P3}','${A}','{}'::jsonb)`],
  ['one person likes both of them',           'ok',     F, 0,
    `insert into react(post,actor,kind,created_at)
          values ('${P2}','${F}','like', now() + interval '2 minutes'),
                 ('${P3}','${F}','like', now() + interval '3 minutes')`],
  ['one person on two posts is ONE notice',   'ok',     A, 0,
    `select 1 from (select count(*) c from notices(50)
                     where kind='like' and n = 1
                       and hd = (select handle from profile where id='${F}')) q
      where q.c = 1`],
  ['and it says how many POSTS',              'ok',     A, 0,
    `select 1 from notices(50) where kind='like' and np = 2
       and hd = (select handle from profile where id='${F}')`],
  ['and it still says one person',            'ok',     A, 0,
    `select 1 from notices(50) where kind='like' and np = 2 and n = 1
       and hd = (select handle from profile where id='${F}')`],
  /* It has to lead somewhere: a row about two posts still opens one, and it
     is the newest of them rather than whichever the planner reached for. */
  ['and it leads to the newest of them',      'ok',     A, 0,
    `select 1 from notices(50) where kind='like' and np = 2 and post='${P3}'`],
  /* And the first shape is not damaged by the second. Several people on one
     post must STAY about the post -- folding those by actor as well would
     turn 「A と B がいいねしました」 into two rows again. */
  ['several people on one post stay one row', 'ok',     A, 0,
    `select 1 from (select count(*) c from notices(50)
                     where kind='like' and post='${P}') q where q.c = 1`],
  ['and that row still says two people',      'ok',     A, 0,
    `select 1 from notices(50) where kind='like' and post='${P}' and n = 2 and np = 1`],
  /* Nothing is counted twice: every like of A's is in exactly one row. Two
     on P, two by G4 -- four events, and the numbers across the rows add up
     to four. A fold that put an event in both shapes would read five. */
  ['no like is in two rows at once',          'ok',     A, 0,
    `select 1 from (select sum(greatest(n, np)) t from notices(50)
                     where kind='like') q where q.t = 4`],

  /* --- and what is going round -------------------------------------------
     Four hours, and the list STANDS STILL between ticks (schema.sql § what is
     going round). Not one attempt about it can live here, and that is the
     freeze being real rather than a gap: every row this file writes lands at
     now(), now() is after the tick, and feed_hot() takes what existed AT the
     tick. Nothing written during a run is in the list at all.

     So the whole of it is in SHAPE below, against rows seeded by the owner of
     the tables with ages put on them from outside -- which is also the only
     way ages exist at all, since `created_at` is deliberately kept out of the
     `grant insert (...)` on post: a post may not lie about when it was
     written. */

  /* --- and a search somebody starred, which is the other one -------------
     Weaker than a draft and still nobody else's: what a person looks for
     says as much about them as what they write. The same four attempts, and
     the read first for the same reason -- it is the one that costs somebody
     something even when nothing is written, and the one a `using (true)`
     would hand over without a sound. */
  ['A stars a search',                        'ok',     A, 0,
    `insert into saved_search(id,author,q) values ('${SV}','${A}','kano')`],
  ['and reads it back',                       'ok',     A, 0,
    `select 1 from saved_search where id='${SV}'`],
  ['B cannot read what A looks for',          'denied', B, 0,
    `select 1 from saved_search where id='${SV}'`],
  ['B cannot change it',                      'denied', B, 0,
    `update saved_search set q='x' where id='${SV}'`],
  ['B cannot delete it',                      'denied', B, 0,
    `delete from saved_search where id='${SV}'`],
  ['nor can somebody with no account read one', 'denied', D, 1,
    `select 1 from saved_search where id='${SV}'`],
  ['B cannot star a search onto A',           'denied', B, 0,
    `insert into saved_search(id,author,q) values ('${SV2}','${A}','kano')`],
  ['B stars one of their own',                'ok',     B, 0,
    `insert into saved_search(id,author,q) values ('${SV2}','${B}','tir')`],
  ['nor hand it to A',                        'denied', B, 0,
    `update saved_search set author='${A}' where id='${SV2}'`],
  /* The same words twice is the same star. Without it the phone would have
     two rows saying one thing and no way to tell which one the person meant
     to unstar. */
  ['starring the same words twice is once',   'denied', A, 0,
    `insert into saved_search(author,q) values ('${A}','kano')`],
  /* And an empty star is not a search. A row saying nothing is a row the
     screen has to draw and nobody can act on. */
  ['and an empty one is not a search',        'denied', A, 0,
    `insert into saved_search(author,q) values ('${A}','')`],

  /* --- and what somebody merely TYPED, which is the weakest and the worst --
     A star is a word a person chose to keep; a history is every word they
     tried. It is the more revealing of the two and it is written without
     anybody deciding to write it, so the read is the attempt that matters:
     `using (true)` here would publish the list of names somebody has been
     looking up, and nothing would throw.

     Four attempts and then the two the table's own shape makes, exactly as
     the star above -- they are separate tables and a policy proved on one
     says nothing about the other. */
  ['A searches for something',                'ok',     A, 0,
    `insert into recent_search(id,author,q) values ('${RC}','${A}','kano')`],
  ['and reads their own history',             'ok',     A, 0,
    `select 1 from recent_search where id='${RC}'`],
  ['B cannot read what A has typed',          'denied', B, 0,
    `select 1 from recent_search where id='${RC}'`],
  ['B cannot change it',                      'denied', B, 0,
    `update recent_search set q='x' where id='${RC}'`],
  ['B cannot delete it',                      'denied', B, 0,
    `delete from recent_search where id='${RC}'`],
  ['nor can somebody with no account read one', 'denied', D, 1,
    `select 1 from recent_search where id='${RC}'`],
  ['B cannot put a search onto A',            'denied', B, 0,
    `insert into recent_search(id,author,q) values ('${RC2}','${A}','kano')`],
  ['B searches for something of their own',   'ok',     B, 0,
    `insert into recent_search(id,author,q) values ('${RC2}','${B}','tir')`],
  ['nor hand it to A',                        'denied', B, 0,
    `update recent_search set author='${A}' where id='${RC2}'`],
  /* Typing the same words again is the SAME search moving to the top, not a
     second line of it. Without this the list of five would fill with one
     word. */
  ['typing the same words twice is one row',  'denied', A, 0,
    `insert into recent_search(author,q) values ('${A}','kano')`],
  /* And an empty history row is not a search anybody made. */
  ['and an empty one is not a search',        'denied', A, 0,
    `insert into recent_search(author,q) values ('${A}','')`],

  /* --- a draft, which is the one thing here that is nobody else's ---------
     Every other table in this file is either already public or on its way to
     being public, and their select policies say so. `draft` is what somebody
     has written and NOT decided to say, so the read is locked to the author
     the same way the write is -- and a read policy that is too wide is
     exactly the failure this whole file exists for: nothing throws, the app
     looks right, and somebody's half-written post is readable by anybody with
     the publishable key.

     A writes one through the policy rather than it being seeded, for the
     reason the note over the seeding says: a row put there by the owner of
     the table is a row no policy ever had to allow. */
  ['A keeps a draft',                         'ok',     A, 0,
    `insert into draft(id,author,body) values ('${DR}','${A}','{\"ln\":\"secret\"}'::jsonb)`],
  ['and reads it back',                       'ok',     A, 0,
    `select 1 from draft where id='${DR}'`],
  /* The four somebody else would try. READ FIRST and not last: it is the one
     that costs somebody something even when nothing is written, and it is the
     one a `for all` policy or a `using (true)` would hand over in silence. */
  ['B cannot read A\u2019s draft',             'denied', B, 0,
    `select 1 from draft where id='${DR}'`],
  ['B cannot change it',                      'denied', B, 0,
    `update draft set body='{\"ln\":\"x\"}'::jsonb where id='${DR}'`],
  ['B cannot delete it',                      'denied', B, 0,
    `delete from draft where id='${DR}'`],
  ['nor can somebody with no account read one', 'denied', D, 1,
    `select 1 from draft where id='${DR}'`],
  /* And B cannot write one ONTO A -- a draft in A's list that A never wrote.
     A separate statement from the three above: those are about rows that are
     already there, and this is about arriving. */
  ['B cannot write a draft onto A',           'denied', B, 0,
    `insert into draft(id,author,body) values ('${DR2}','${A}','{}'::jsonb)`],
  /* Nor hand their own away, which is the same row moving the other
     direction and is what `with check` on the update is for. Without it the
     three refusals above still pass and A ends up holding a draft B wrote. */
  ['B keeps a draft of their own',            'ok',     B, 0,
    `insert into draft(id,author,body) values ('${DR2}','${B}','{}'::jsonb)`],
  ['nor hand it to A',                        'denied', B, 0,
    `update draft set author='${A}' where id='${DR2}'`],
  /* --- the line somebody writes about themselves -------------------------
     「自己紹介を見せないって選択肢を俺はいつ与えた？」OWNER 2026-09-01.

     It is SHOWN, so the claim here is not the usual one. Reading is open --
     `profile_read` is `using (true)` and a bio is part of a profile the way
     a handle is -- and what must hold is that only the person WRITES it.

     The grant is the half that would fail silently. schema.sql revokes UPDATE
     and INSERT on profile and names the columns back, so a column added
     without being named in those two lines is one nothing can ever write:
     no error at the policy, just a row that never changes. Both directions
     are here for that reason. */
  ['A writes A\u2019s own bio',               'ok',     A, 0,
    `update profile set bio='a line about me' where id='${A}'`],
  ['and it can be read by anybody',           'ok',     B, 0,
    `select 1 from profile where id='${A}' and bio='a line about me'`],
  ['and by somebody with no account',         'ok',     B, 1,
    `select 1 from profile where id='${A}' and bio='a line about me'`],
  ['B cannot write A\u2019s bio',             'denied', B, 0,
    `update profile set bio='not theirs to write' where id='${A}'`],
  ['nor can somebody with no account',        'denied', B, 1,
    `update profile set bio='not theirs to write' where id='${A}'`],
  ['and a bio past the ceiling is refused',   'denied', A, 0,
    `update profile set bio=repeat('x', 161) where id='${A}'`],
  ['and one at the ceiling is not',           'ok',     A, 0,
    `update profile set bio=repeat('x', 160) where id='${A}'`],
  ['and a bio may be given on the way in',    'ok',     G4, 0,
    `insert into profile(id,handle,bio) values ('${G4}','probe4','hello')`],

  /* --- what this account has paid for -----------------------------------
     「課金とアカウントとキーボードはアカウントに結びつく」OWNER 2026-09-01.

     Two different claims and both are real attacks. B WRITING A's plan is
     somebody buying nothing and giving themselves everything on another
     person's account. B READING A's plan is why this is a table of its own
     rather than a column on `profile`, which is `using (true)` -- what
     somebody pays is not a handle.

     What is NOT claimed here, and must not be read into a green run: that
     somebody cannot set their OWN plan. They can. The phone writes this row
     and the phone is the person; closing it needs Apple's receipt checked by
     something that is not the phone. docs/scope/claude-acct2.md. A test that
     appeared to cover it would be worse than none. */
  ['A writes A\u2019s own plan',              'ok',     A, 0,
    `insert into plan(id,plan) values ('${A}','pro')`],
  ['B cannot write A\u2019s plan',            'denied', B, 0,
    `insert into plan(id,plan) values ('${A}','pro')`],
  ['B cannot change A\u2019s plan',           'denied', B, 0,
    `update plan set plan='free' where id='${A}'`],
  ['B cannot read what A pays',               'denied', B, 0,
    `select 1 from plan where id='${A}'`],
  ['nor can somebody with no account read a plan', 'denied', B, 1,
    `select 1 from plan where id='${A}'`],
  ['nor write a plan',                        'denied', B, 1,
    `insert into plan(id,plan) values ('${B}','pro')`],
  ['B cannot delete A\u2019s plan',           'denied', B, 0,
    `delete from plan where id='${A}'`],
  ['nor can A delete their own',              'denied', A, 0,
    `delete from plan where id='${A}'`],
  ['and a tier nobody sells is refused',      'denied', A, 0,
    `update plan set plan='studio' where id='${A}'`],
  ['A still reads their own',                 'ok',     A, 0,
    `select 1 from plan where id='${A}'`],
  /* Deleting the account takes the drafts with it. Asked by DOING it, and
     asked as the owner of the table rather than through a policy, because
     what has to hold is that the row is GONE -- a select that returns nothing
     because the reader may not see it would pass this while the draft sat
     there. 「アカウント削除で残るものねえ」 OWNER. */
  ['A\u2019s draft goes when A does',          'ok',     A, 0,
    `select account_delete()`]
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
  /* These two used to say the opposite, and they are worth keeping as a note
     rather than deleting silently: they held the SPLIT -- that there was a
     question asking only for an account, and that a language asked it rather
     than the other one. Both were true and both were replaced by
     OWNER DECISION 2026-08-26. The pair that stands now is at the foot of this
     list: no such question exists, and every write to a language asks the same
     thing a post does. */
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
  /* What a language is made of has two doors and not one, and the shape of
     the policy has to show both. \u300c\u516c\u958b\u3057\u305f\u3089\u516c\u958b\u3001\u975e\u516c\u958b\u306b\u3057\u305f\u3089\u975e\u516c\u958b\u300d
     OWNER 2026-08-28.

     The owner's door: whoever owns the language, at any setting. */
  ['a language is always its owner\u2019s', `
     select count(*) from pg_policies
      where tablename='slice' and cmd='SELECT'
        and coalesce(qual,'') not like '%owner = auth.uid()%'`, '0'],
  /* And the published door, which is what the About page is read through. */
  ['and published is what opens the other one', `
     select count(*) from pg_policies
      where tablename='slice' and cmd='SELECT'
        and coalesce(qual,'') not like '%published_at%'`, '0'],
  /* AND IT IS NOT A BLANKET. Publishing a page opens the page -- \u300c\u8a00\u8a9e\u30da\u30fc\u30b8
     \u516c\u958b\u3068\u5358\u8a9e\u3084\u6587\u5b57\u306edl\u53ef\u80fd\u306f\u5225\u3060\u3057\u300d -- so the policy names the kinds it
     opens, and a policy that stopped naming any would be publishing handing
     over the dictionary. The cases above prove which kinds; this proves that
     the question is asked at all. */
  ['and it opens named kinds, not everything', `
     select count(*) from pg_policies
      where tablename='slice' and cmd='SELECT'
        and coalesce(qual,'') not like '%kind%'`, '0'],
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
          and prosrc like '%where handle = h and h <> ''lingua''%') <> 1) q`, '0'],
  /* Said the same way `staff` is said, one line down in this list: a column
     nobody signs in as may write is the only reason the functions above are
     the only road to it. */
  /* THE NAME IS THE FLAG NOW, and the name IS writable -- that is what the
     profile screen's rename is. So what holds it is the trigger, asked for by
     name here the way staff_drop's clause is above. */
  ['nor is the one above staff something an account gives itself', `
     select count(*) from (select 1 where
       (select count(*) from pg_trigger where tgname='profile_rename'
          and not tgisinternal) <> 1) q`, '0'],
  /* The first one is written down here rather than remembered by a person.
     Both halves: the trigger for a row that arrives later, and something in
     the file that catches a row already there. */
  /* And nobody says when they last renamed themselves. The fortnight above is
     worth exactly what this line is worth: an account that could write
     handle_at could write that it was a month ago, and the rule would hold
     against nobody who did not want it to hold. Asked of the catalog rather
     than by trying it, because an attempt would be refused by the grant and by
     the policy at once and only one of those is the claim.

     WRITING, and not reading. SELECT on this column stays and is wanted: the
     profile screen has to be able to say when the @ can next be moved, and a
     state the app cannot see is a field that greys out with nothing to read
     off it. What is asked here is the two that would let somebody choose the
     answer. */
  ['nobody writes down when they last renamed', `
     select count(*) from information_schema.column_privileges
      where table_schema='public' and table_name='profile'
        and column_name='handle_at' and grantee in ('anon','authenticated')
        and privilege_type in ('INSERT','UPDATE')`, '0'],
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
  /* The question that is no longer asked. Two halves, because deleting a
     function and stopping a policy from wanting one are different statements
     and only the second is the rule. 「言語はアカウントないと作れないです」 */
  ['there is no way to ask that only wants an account', `
     select count(*) from pg_proc where proname='has_account'`, '0'],
  ['and a language asks the same thing a post does', `
     select count(*) from pg_policies
      where tablename in ('language','slice') and cmd <> 'SELECT'
        and coalesce(qual,'') || coalesce(with_check,'') not like '%is_member%'`, '0'],
  /* No policy, either way. Staff DO drop a report that was about nothing, and
     that is report_drop() -- a security definer function asking is_staff(),
     the same shape as post_hide(). A policy would be a second place saying who
     may act on a report, and the person it is about would be reaching the same
     door. */
  ['a report is edited or withdrawn through no policy', `
     select count(*) from pg_policies
      where tablename='report' and cmd in ('UPDATE','DELETE')`, '0'],
  ['the media bucket is there and is public', `
     select count(*) from (select 1) x
      where not exists (select 1 from storage.buckets
                         where id='post-media' and public)`, '0'],
  /* And what is left of A after A asked to be gone. This one is not about the
     shape of the file -- it is the last case above, read back. It is HERE
     rather than there because everything in this list is run as the owner of
     the tables, and that is the only way to ask the question that is actually
     being asked: is the row GONE. Asked as anybody else, a draft that sat
     there untouched would answer "no rows" through draft_read and pass.
     「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消える」 */
  ['no draft outlives the account that wrote it', `
     select count(*) from draft where author='${A}'`, '0'],
  /* And all four of its policies actually name the author.
     This is here because the three attempts above it CANNOT catch a widened
     draft_edit or draft_drop on their own, and that was watched: with
     draft_edit and draft_drop opened to `using (true)`, "B cannot change it"
     and "B cannot delete it" both still passed. PostgreSQL makes an UPDATE or
     a DELETE with a WHERE find its rows through the SELECT policy first, so
     while draft_read is narrow those two are being refused by the READ and
     not by the policy they are named after -- a pass for the wrong reason,
     which is the one thing the head of this file says is worth knowing about.
     Asked of the catalog, where it holds whatever the read policy says. */
  /* The tie and the window, asked of the three posts seeded above. Here and
     not among the attempts because these statements run as the table's owner,
     which is the only way rows of different ages exist at all. */
  /* The tick. 「4時間ごと。0 4 8 12 16 20 24 これは入れ替わらない。」 Asked of
     the clock rather than of the source. Both halves -- the hour is one of
     the six, and nothing below the hour is left on it. */
  ['the list turns on a four-hour tick', `
     select count(*) from (select 1 where
       extract(hour from (feed_slot() at time zone 'America/Los_Angeles'))::int % 4 <> 0
       or extract(minute from feed_slot())::int <> 0
       or extract(second from feed_slot())::numeric <> 0) q`, '0'],
  /* AND IT TURNS WHERE THE DAY TURNS. 「3はアメリカ時間ね」「時間もお題の
     ページに合わせるってこと」 OWNER 2026-08-28 -- two sentences pointing at
     one place. supabase/functions/daily-prompt/index.ts picks `on_day` with
     `timeZone: 'America/Los_Angeles'`, so that is where the day turns and
     this is what 「合わせる」 names.

     It was UTC, under a claim here saying a zone must NOT be named -- read
     off the phone doing no arithmetic, which is a different statement from
     where the boundary is. The two are the same zone or the list turns
     beside the day rather than with it. */
  ['and turns in the zone the day turns in', `
     select count(*) from (select 1 where
       (select count(*) from pg_proc where proname = 'feed_slot'
          and prosrc like '%America/Los_Angeles%') <> 1) q`, '0'],
  ['and names no other zone', `
     select count(*) from (
       select regexp_matches(prosrc, 'time zone ''([^'']+)''', 'g') as z
         from pg_proc where proname in ('feed_slot','feed_hot')) m
      where m.z[1] <> 'America/Los_Angeles'`, '0'],
  /* And it is the tick that has HAPPENED. One in the future is a window that
     has not opened, and every post would be older than it. */
  ['and on the one that has already come', `
     select count(*) from (select 1 where feed_slot() > now()
                                       or feed_slot() <= now() - interval '4 hours') q`, '0'],
  /* 5 beats 3 beats 1. An answer is somebody writing a sentence under you, a
     repost is a tap, a like is a smaller tap, and the order says which was
     more. Read as an ORDER out of what feed_hot() actually returns: asking
     whether the score is right would be asking the function to agree with
     itself. */
  ['an answer outranks a boost', `
     select count(*) from (select 1 where not exists (
       with r as (select id, row_number() over () rn from feed_hot(500))
       select 1 from r a, r b where a.id='${H2}' and b.id='${H1}' and a.rn < b.rn
     )) q`, '0'],
  ['and a boost outranks a like', `
     select count(*) from (select 1 where not exists (
       with r as (select id, row_number() over () rn from feed_hot(500))
       select 1 from r a, r b where a.id='${H1}' and b.id='${H3}' and a.rn < b.rn
     )) q`, '0'],
  /* The list stands still between ticks, and that sentence has a sharp edge:
     NOTHING written since the tick is in it. Every post written through a
     policy above landed at now(), which is after the tick, so this is asked
     of a list with plenty to be wrong with. */
  ['nothing written since the tick is in it', `
     select count(*) from feed_hot(500) where created_at > feed_slot()`, '0'],
  /* Nobody carries the blue mark yet -- there is no column to carry it -- so
     today's ranking is the reactions and nothing else. A multiplier that had
     quietly begun applying to somebody would show up on no screen anywhere. */
  ['nobody carries the mark today', `
     select count(*) from profile where feed_weight(id) <> 1`, '0'],
  /* And what it is worth on the day there is one: X's published figure for a
     post shown to people who do not follow whoever wrote it. */
  ['and the mark is worth four when there is one', `
     select count(*) from (select 1 where feed_paid_weight() <> 4) q`, '0'],
  ['on the same score the newer post is above', `
     select count(*) from (select 1 where not exists (
       with r as (select id, row_number() over () rn from feed_hot(500))
       select 1 from r a, r b where a.id='${H3b}' and b.id='${H4}' and a.rn < b.rn
     )) q`, '0'],
  ['and nothing older than the window is in it', `
     select count(*) from feed_hot(500) where body ? 'old'`, '0'],
  /* Both of the private tables, in one statement. The reason is written over
     draft's: the three attempts above CANNOT catch a widened update or delete
     on their own, because PostgreSQL makes an UPDATE or a DELETE with a WHERE
     find its rows through the SELECT policy first -- so while the read is
     narrow those two are refused by the read and not by the policy they are
     named after. Asked of the catalog, where it holds whatever the read says. */
  ['what is nobody else\u2019s says so in all four policies', `
     select count(*) from (select 1 from (values
       ('draft'),('saved_search'),('recent_search')) t(tbl)
       cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE')) v(cmd)
       where not exists (select 1 from pg_policies p
                          where p.tablename=t.tbl and p.cmd=v.cmd
                            and coalesce(p.qual,'') || coalesce(p.with_check,'')
                                like '%auth.uid()%')) q`, '0'],
  ['a draft is the author\u2019s in all four policies', `
     select count(*) from (select 1 from (values
       ('SELECT'),('INSERT'),('UPDATE'),('DELETE')) v(cmd)
       where not exists (select 1 from pg_policies p
                          where p.tablename='draft' and p.cmd=v.cmd
                            and coalesce(p.qual,'') || coalesce(p.with_check,'')
                                like '%auth.uid()%')) q`, '0']
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
  `insert into auth.users(id) values (${q(A)}),(${q(B)}),(${q(C)}),(${q(D)}),(${q(E)}),(${q(F)}),(${q(G1)}),(${q(G2)}),(${q(G3)}),(${q(G4)}),(${q(N1)}),(${q(N2)}),(${q(N3)});`,
  /* And one row that IS put here by the owner of the table, which the
     paragraph above says nothing else is. That is the claim being tested: no
     policy in schema.sql makes anybody staff, and the column is revoked from
     every role the app signs in as, so there is no other way to arrive at one.
     A staff account that could be made through a policy would be the bug. */
  `insert into profile(id,handle,staff) values (${q(C)},'mod',true);`,
  /* And two accounts with an age on them, put here by the owner of the table
     for the same reason the three posts below are: `handle_at` is deliberately
     left out of BOTH grants on profile, so no account anywhere may say when it
     last renamed itself -- which is the point of the column and is asked as a
     claim in SHAPE. There is therefore no account that could make these two,
     and everything above lands in one transaction sharing one now(), so an age
     has to be put on from outside or there are no ages at all.
     Nothing here opens a door: they are two ordinary profiles, and the third
     account of the three makes its own through the policy like everybody. */
  `insert into profile(id,handle,handle_at) values
     (${q(N2)}, 'twoo',   now() - interval '15 days'),
     (${q(N3)}, 'threeo', now() - interval '13 days');`,
  run,
  /* Three posts of different ages, written HERE by the owner of the table and
     not by anybody a policy lets write. That is not a shortcut around a
     policy: `created_at` is deliberately left out of the `grant insert (...)`
     on post at the foot of schema.sql, so a post may not lie about when it
     was written, and there is therefore no account anywhere that could make
     these. Everything above lands in ONE transaction and shares one now(),
     so ages have to be put on from outside it or there are no ages at all.
     What is being asked of them is an ORDER, and nothing here opens a door:
     they are three ordinary posts by B with nothing done to them. */
  `insert into post(id,author,body,created_at) values
     (${q(H1)}, ${q(B)}, '{}'::jsonb,        feed_slot() - interval '30 minutes'),
     (${q(H2)}, ${q(B)}, '{}'::jsonb,        feed_slot() - interval '30 minutes'),
     (${q(H3)}, ${q(B)}, '{}'::jsonb,        feed_slot() - interval '30 minutes'),
     (${q(H4)}, ${q(B)}, '{}'::jsonb,        feed_slot() - interval '20 minutes'),
     (${q(H3b)},${q(B)}, '{}'::jsonb,        feed_slot() - interval '10 minutes'),
     (${q(H5)}, ${q(B)}, '{"old":1}'::jsonb, feed_slot() - interval '3 days');`,
  /* And what was done to them, also before the tick. F and not A: A asked to
     be deleted among the attempts above and is gone by the time this runs. */
  `insert into react(post,actor,kind,created_at) values
     (${q(H1)}, ${q(F)}, 'boost', feed_slot() - interval '25 minutes'),
     (${q(H3)}, ${q(F)}, 'like',  feed_slot() - interval '25 minutes');`,
  `insert into post(author,body,reply_to,created_at) values
     (${q(F)}, '{}'::jsonb, ${q(H2)}, feed_slot() - interval '25 minutes');`,
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
