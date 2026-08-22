-- ---------------------------------------------------------------------------
-- Lingua — what the server holds, and who may touch it.
--
-- RUN THE WHOLE FILE, EVERY TIME. 「一回で全部のsql流せる形でまとめて。
-- じゃないと何流して何をしたかわからなくなる」
--
-- Every statement below is written so that running it a second time changes
-- nothing: tables are `if not exists`, indexes are `if not exists`, a policy
-- is dropped before it is made, a bucket is `on conflict do nothing`, and a
-- function is `create or replace`. So there is never a question of which half
-- has been applied — paste the file into the SQL editor and run it, and the
-- database is what this file says whatever state it was in.
--
-- Columns added after the first run get an `alter table ... add column if not
-- exists` of their own, below the table, for the same reason: a table that
-- already exists skips its own definition, so a new column has to be said
-- twice or it only reaches an empty project.
--
-- tools/rls-check.mjs applies this file TWICE against an empty PostgreSQL
-- before it tries anything, so "it can be run again" is held rather than
-- claimed.
--
-- Locked accounts come later, and the note on the post policy says what they
-- will cost.
--
-- The rule this file exists to enforce is the one that ends a small app if it
-- is wrong: row level security. Every table below denies everything by default
-- and is opened one policy at a time. A missing policy makes a feature not
-- work, which somebody notices in a minute. A policy that is too wide lets a
-- stranger rewrite somebody's language, which nobody notices until it has
-- happened to a person who spent months on it.
--
-- What is deliberately NOT here
--   the free/paid limit. "One language you write, any number you read" is a
--   price, and prices change. There is no constraint below that counts a
--   person's languages -- the app and one edge function enforce it, and the
--   schema stays true whatever the plan becomes. A CHECK constraint would have
--   to be migrated the first time the answer stops being one.
--
--   the words, the letters, the drawn glyphs. A language is made on the
--   device and stays there; what is published is a copy, and what is quoted
--   is frozen into the post that quotes it. The phone is the original.
-- ---------------------------------------------------------------------------

-- ---- who ------------------------------------------------------------------
-- One row per account. auth.users is Supabase's; nothing outside this file
-- should read it, so everything the app needs about a person is here.
create table if not exists profile (
  id          uuid primary key references auth.users on delete cascade,
  handle      text unique not null check (handle ~ '^[a-z0-9_]{2,24}$'),
  display     text,
  created_at  timestamptz not null default now()
);

-- The face somebody wears where there is no post to take one off. A notice
-- says "this person liked it" and has to draw them; a follow has no post at
-- all. It is the same shape a post carries (postAvatar() in www/post.js): a
-- drawn letter, a borrowed character, or a photograph, cut loose from the
-- language so it survives being read by somebody who does not have it.
--
-- It is NOT what a post wears. A post's face is frozen onto the post when it
-- is written (rule 8) and does not change when this does. This is what the
-- person looks like NOW, which is the right answer for a notice and the wrong
-- one for a post.
alter table profile add column if not exists av jsonb;

-- Whoever answers the reports. It is set by hand in the Supabase dashboard and
-- by nothing else: no policy below writes it, and the column is taken out of
-- what an account may update at the foot of this file. An app that could make
-- somebody staff would be an app where being reported is a thing you can vote
-- your way out of.
--
-- It is not a role, a tier or a badge. It answers one question -- may this
-- account read reports and take a post down -- and the day it has to answer a
-- second one it should become a table of its own rather than a second boolean.
alter table profile add column if not exists staff boolean not null default false;

-- And whoever has been ejected. A timestamp rather than a boolean beside a
-- date, for the same reason post.hidden_at is one: two columns that have to
-- agree about whether something happened are two columns that can disagree.
--
-- What it does is one line in is_member() below, which every policy for
-- something OTHER PEOPLE SEE asks. It is not in has_account(), so being frozen
-- stops the timeline and not the work: somebody ejected can still read, can
-- still write their own language, and can still delete their account, because
-- account_delete() does not ask is_member() either and must not -- being
-- thrown out of a place is not a reason to be locked out of the door marked
-- exit. 「制作は好きにやらせればいいし、sns止められても作りたいやつは作るでしょ」
alter table profile add column if not exists banned_at timestamptz;
alter table profile add column if not exists banned_why text;

-- ---- what ------------------------------------------------------------------
-- A language. Published or not; a language nobody published is a private
-- backup of what is on the phone.
--
-- Deleting an account deletes this too. There is no half-deleted language
-- with no owner waiting to be reclaimed: coming back later is what signing
-- out is for, and signing out leaves everything exactly where it was. The two
-- were one thing here for a while, and a delete that quietly kept your work
-- is a delete that lied.
--
-- What this cannot reach: a copy already on somebody else's phone. A language
-- is published by being copied, and a reader who downloaded yours has it. The
-- promise a person can be given is that it goes from here, which is the only
-- promise that is true.
create table if not exists language (
  id           uuid primary key default gen_random_uuid(),
  -- The ACCOUNT, not the person. auth.users and not profile, because a
  -- language is made on the first launch by an anonymous account and an
  -- anonymous account has no profile row: a handle is what a profile IS, and
  -- a handle is the thing nobody has been asked for yet.
  --
  -- post.author stays on profile for the same reason read the other way --
  -- a post is read by other people and has to be signed.
  owner        uuid not null references auth.users(id) on delete cascade,
  name         text not null default '',
  -- what the author says others may do with the font and the glyphs. The app
  -- shows this; it does not enforce it. We are the record, not the arbiter.
  license      text not null default 'ask'
               check (license in ('ask', 'personal', 'free')),
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
-- And on a database that already has the table, where `create table if not
-- exists` above did nothing at all. Named rather than left to the default so
-- that dropping it says which one; `if exists` on both halves so this file
-- goes on being applied twice in a row by npm run rls.
alter table language drop constraint if exists language_owner_fkey;
alter table language add  constraint language_owner_fkey
  foreign key (owner) references auth.users(id) on delete cascade;
create index if not exists language_owner_idx on language(owner);
create index if not exists language_published_idx on language(published_at) where published_at is not null;

-- ---- what a language is made of ---------------------------------------
-- Eleven slices -- words, lines, lang, script, letters, notes, phases, talk,
-- snd, kb, wld -- and they are SLICES here for the same reason they are
-- slices in www/core.js: one row per slice and not one row per language.
--
-- The reason is what happens with two phones. One number for a whole language
-- means adding a word on one phone and drawing a letter on the other is a
-- collision, and one of the two has to lose something nobody was arguing
-- about. Per slice they do not touch each other at all.
--
-- Inside one slice the phone merges rather than overwriting -- a word added
-- here and a word added there are both added -- so what is stored is the
-- result and not a claim about who was first. `no` goes up by one on every
-- write and is what says a phone is holding something older than the server:
-- the phone reads, merges what it has into what came back, and writes with
-- the number it read.
--
-- `body` is text and not jsonb on purpose: it is exactly the string
-- localStorage holds, which is what bkPack() already writes out to a file,
-- so there is one shape for a slice and not two that could disagree. The
-- server never looks inside it.
create table if not exists slice (
  language   uuid not null references language(id) on delete cascade,
  kind       text not null,
  body       text not null default '',
  no         bigint not null default 1,
  at         timestamptz not null default now(),
  primary key (language, kind)
);
create index if not exists slice_language_idx on slice(language);

-- The record that settles arguments without anybody having to judge one.
-- Append only: no update policy and no delete policy exist for this table, so
-- a row cannot be altered by anyone through the API, including its author.
-- Nine tenths of "he took my script" is answered by a timestamp.
create table if not exists publication (
  id        bigint generated always as identity primary key,
  language  uuid not null references language(id) on delete cascade,
  actor     uuid references profile(id) on delete set null,
  kind      text not null check (kind in ('language', 'glyphs', 'post')),
  digest    text not null,          -- sha-256 of exactly what was published
  at        timestamptz not null default now()
);
create index if not exists publication_language_idx on publication(language, at desc);

-- ---- asked --------------------------------------------------------------
-- One sentence a day, put up by us, that anybody may answer in their own
-- language. It is the loop this whole thing turns on: everyone already knows
-- what the day's sentence means, so a feed of two hundred unreadable scripts
-- becomes two hundred readable ones, and nobody has to learn anything to read
-- it. Posts stay, so a prompt accumulates -- the same meaning in every
-- language anybody has built, which is a page worth coming back to long after
-- the day it belonged to.
--
-- Nobody but us writes one. There is no insert policy below, so the API
-- cannot make one at all: they arrive through the service role, which is a
-- key that lives on our side and answers to no policy. A prompt table anyone
-- could write to is a second posting surface with no author on it.
--
-- It is here, above the post, rather than below it where it reads better: post
-- has a foreign key to this table, and a foreign key cannot point at a table
-- that does not exist yet. This file had it the other way round and had never
-- been run, so nobody had found out.
create table if not exists prompt (
  id      bigint generated always as identity primary key,
  on_day  date not null unique,        -- one a day, and the unique says so
  text    text not null,               -- English, and translated on the device
  created_at timestamptz not null default now()
);

-- ---- said ------------------------------------------------------------------
-- A post is a thing somebody said, once. body holds the runs of text and the
-- glyph outlines they were drawn with AT THE TIME -- frozen, because a post is
-- a record of an utterance and the author of the language may redraw a letter
-- tomorrow. The outlines are stored once per post and referenced per letter,
-- so a long post in a 30-letter alphabet carries 30 shapes, not 300.
create table if not exists post (
  id         uuid primary key default gen_random_uuid(),
  author     uuid not null references profile(id) on delete cascade,
  language   uuid references language(id) on delete set null,
  body       jsonb not null,
  -- the day's sentence this answers, when it answers one. Most posts do not:
  -- a post is whatever somebody felt like saying.
  prompt     bigint references prompt(id) on delete set null,
  -- What this answers. A column and not a field of body, because a thread is
  -- read by asking for it -- "every post whose reply_to is this one" -- and a
  -- jsonb field cannot be indexed for that without saying so anyway.
  --
  -- set null and not cascade: deleting a post must not delete the answers to
  -- it. A reply already carries the handle of whoever it answered, put on it
  -- when it was written (post.toh, rule 13), so it goes on saying who it was
  -- for after the post itself is gone -- which is exactly what tools/post-check
  -- holds on the phone. The thread loses its head and keeps its body.
  reply_to   uuid references post(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists post_prompt_idx on post(prompt, created_at desc);
create index if not exists post_author_idx on post(author, created_at desc);
create index if not exists post_language_idx on post(language, created_at desc);
-- Said twice, so a project that already has `post` gets the column too. See
-- the note at the head of the file.
alter table post add column if not exists reply_to uuid references post(id) on delete set null;
create index if not exists post_reply_idx on post(reply_to, created_at) where reply_to is not null;

-- Taken down, rather than deleted. Three reasons, and the third is the one
-- that decided it: a deletion cannot be undone when the report turns out to be
-- wrong; the reports about it point at a row that has to still be there; and
-- the person who wrote it is told what happened by the post still being in
-- their own timeline with a line on it, instead of by silence.
--
-- Nobody may set these but the two functions at the foot of this file. The
-- author can update their own post -- post_edit below -- and an author who
-- could clear this could put their own post back up.
alter table post add column if not exists hidden_at timestamptz;
alter table post add column if not exists hidden_why text;
create index if not exists post_hidden_idx on post(hidden_at) where hidden_at is not null;

-- A word taken from somebody else's language and used in a post. This is the
-- citation, and it is a table rather than a field in body because it is the
-- thing being counted: how often a language is spoken by people who did not
-- make it is the one number that says whether any of this worked.
create table if not exists quote (
  post      uuid not null references post(id) on delete cascade,
  language  uuid not null references language(id) on delete cascade,
  word      text not null,
  primary key (post, language, word)
);
create index if not exists quote_language_idx on quote(language);

-- ---- answered ------------------------------------------------------------
-- A like or a boost. One row per person per post per kind, which is what the
-- primary key says, so pressing twice cannot count twice from one account and
-- the app does not have to be careful about it.
--
-- A COUNT IS NOT STORED. The number under a post is `select count(*)`, and
-- the reason is the one www/net.js already gives: two phones sending counts is
-- how a number goes backwards. A phone says "I liked this" or "I no longer
-- do"; adding up is the server's, and a row that exists is not an opinion.
--
-- There is no update policy below, and that is not an oversight: a reaction is
-- on or off. Changing a like into a boost is deleting one and inserting the
-- other, which is also what it is on the screen.
create table if not exists react (
  post       uuid not null references post(id) on delete cascade,
  actor      uuid not null references profile(id) on delete cascade,
  kind       text not null check (kind in ('like', 'boost')),
  created_at timestamptz not null default now(),
  primary key (post, actor, kind)
);
-- counting a post's likes, and drawing somebody's notices
create index if not exists react_post_idx on react(post, kind);
create index if not exists react_actor_idx on react(actor, created_at desc);

-- ---- followed ------------------------------------------------------------
create table if not exists follow (
  follower   uuid not null references profile(id) on delete cascade,
  followed   uuid not null references profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followed),
  check (follower <> followed)
);

-- ---- keeping somebody away from you ----------------------------------------
-- Who you will not see. A block one phone knows about is not a block: the
-- other person's posts have to stop arriving, and that is a question the
-- timeline asks the server.
--
-- It is one-directional and it is nobody's business but yours. `block_read`
-- below answers with YOUR rows only -- being blocked is not something a
-- person is told, because telling them is how a block becomes an argument.
create table if not exists block (
  actor      uuid not null references profile(id) on delete cascade,
  blocked    uuid not null references profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor, blocked),
  check (actor <> blocked)
);
create index if not exists block_actor_idx on block(actor);

-- ---- saying that something is wrong ----------------------------------------
-- A report is written and never read back by anybody using the app. It goes to
-- whoever is looking at the dashboard, which is the whole point: a person who
-- could read reports could find out who reported them.
--
-- A post OR a person, and at least one of the two. Reporting a post is the
-- common case; reporting an account with no particular post is the other one.
--
-- `why` is a closed set, because a free-text-only report is a report nobody
-- can count. `note` is optional and is the person's own words.
create table if not exists report (
  id         bigint generated always as identity primary key,
  -- Nullable, and `set null` rather than `cascade`, and both for one reason:
  -- a report is about somebody ELSE. Cascading it off the reporter meant that
  -- deleting your own account quietly withdrew every report you had ever
  -- made, which is a way of clearing the record about a third party that
  -- nobody chose and nobody would see happen. It survives its author leaving.
  -- (`who` still cascades: a report about an account that no longer exists is
  -- about nothing.)
  actor      uuid references profile(id) on delete set null,
  post       uuid references post(id) on delete cascade,
  who        uuid references profile(id) on delete cascade,
  why        text not null check (why in ('spam','abuse','hate','sexual','other')),
  note       text,
  created_at timestamptz not null default now(),
  check (post is not null or who is not null)
);
create index if not exists report_made_idx on report(created_at desc);
-- Said again for a project that already has the table, the way the head of
-- this file explains. It was `not null ... on delete cascade` until account
-- deletion existed to fire it.
alter table report alter column actor drop not null;
alter table report drop constraint if exists report_actor_fkey;
alter table report add constraint report_actor_fkey
  foreign key (actor) references profile(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Every table is denied by default the moment this is enabled, and each policy
-- below opens exactly one door. Read them as sentences: who, may do what, to
-- which rows.
--
-- Anonymous accounts can read and cannot write. Supabase gives an anonymous
-- sign-in a real uid, so "not signed in" is not the test -- the JWT carries
-- is_anonymous, and that is what the writing policies check. Somebody browsing
-- without an account is a person who has not decided yet, not a stranger: when
-- they register, the same uid is linked and nothing they did is lost.
-- ---------------------------------------------------------------------------
alter table profile     enable row level security;
alter table language    enable row level security;
alter table publication enable row level security;
alter table post        enable row level security;
alter table quote       enable row level security;
alter table react       enable row level security;
alter table prompt      enable row level security;
alter table follow      enable row level security;
alter table block       enable row level security;
alter table report      enable row level security;

-- Two questions, and until now they were one.
--
-- The app makes an anonymous account at first launch -- no address, no
-- handle, nobody -- and everything somebody makes belongs to it from the
-- first minute. So "may this account write" splits along what the write is
-- FOR:
--
--   has_account()  there is an account. Anonymous counts, and frozen counts.
--                  What it guards is what is nobody else's business: your
--                  language, and everything filed under it.
--   is_member()    the account has a name on it and has not been frozen.
--                  What it guards is everything other people would see.
--
-- 「課金とツイートにはログイン必須。それ以外は流さない」
--
-- Anonymous is not a lesser account and this is not a trial: attaching an
-- identity later keeps the same uid, so nothing is copied, moved or claimed
-- at that moment. The row that was yours goes on being yours.
create or replace function has_account() returns boolean
language sql stable as $$
  select auth.uid() is not null
$$;

-- A signed-in account that is not an anonymous one, and has not been frozen.
create or replace function is_member() returns boolean
language sql stable as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
     and not exists (select 1 from profile
                      where id = auth.uid() and banned_at is not null)
$$;

-- And the one account that answers the reports. Written the same way and read
-- the same way: a sentence that is true or false about whoever is asking.
create or replace function is_staff() returns boolean
language sql stable as $$
  select exists (select 1 from profile where id = auth.uid() and staff)
$$;

-- profile: everyone reads, you write yourself into existence and edit yourself
drop policy if exists profile_read on profile;
create policy profile_read on profile for select using (true);
drop policy if exists profile_make on profile;
create policy profile_make on profile for insert with check (is_member() and id = auth.uid());
drop policy if exists profile_edit on profile;
create policy profile_edit on profile for update using (is_member() and id = auth.uid())
                                              with check (id = auth.uid());

-- language: a published one is readable by anyone; an unpublished one only by
-- the person who owns it. Only the owner ever writes.
--
-- has_account() and not is_member(), and this is the whole of what the split
-- is for: a language is made on the first launch, by somebody who has not
-- said who they are and may never say. Publishing one is the other half and
-- goes through publication below, which does ask is_member() -- putting a
-- language in front of other people is the same kind of act as posting.
drop policy if exists language_read on language;
create policy language_read on language for select
  using (published_at is not null or owner = auth.uid());
drop policy if exists language_make on language;
create policy language_make on language for insert
  with check (has_account() and owner = auth.uid());
drop policy if exists language_edit on language;
create policy language_edit on language for update
  using (has_account() and owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists language_drop on language;
create policy language_drop on language for delete
  using (has_account() and owner = auth.uid());

-- slice: nobody else's business. Read and written by whoever owns the
-- language and by nobody else -- not even for a language that is PUBLISHED,
-- because publishing is a copy somebody is given and not a door into the
-- phone. has_account() rather than is_member(), the same as language above:
-- this is what a first launch writes.
alter table slice enable row level security;
drop policy if exists slice_read on slice;
create policy slice_read on slice for select
  using (exists (select 1 from language l
                  where l.id = language and l.owner = auth.uid()));
drop policy if exists slice_make on slice;
create policy slice_make on slice for insert
  with check (has_account() and exists (select 1 from language l
                  where l.id = language and l.owner = auth.uid()));
drop policy if exists slice_edit on slice;
create policy slice_edit on slice for update
  using (has_account() and exists (select 1 from language l
                  where l.id = language and l.owner = auth.uid()))
  with check (exists (select 1 from language l
                  where l.id = language and l.owner = auth.uid()));
drop policy if exists slice_drop on slice;
create policy slice_drop on slice for delete
  using (has_account() and exists (select 1 from language l
                  where l.id = language and l.owner = auth.uid()));

-- publication: everyone reads the record. Anyone may add to it about their own
-- language. NOBODY updates or deletes it -- those policies do not exist, which
-- is what makes it a record rather than a claim.
drop policy if exists publication_read on publication;
create policy publication_read on publication for select using (true);
drop policy if exists publication_make on publication;
create policy publication_make on publication for insert with check (
  is_member() and actor = auth.uid()
  and exists (select 1 from language l where l.id = language and l.owner = auth.uid())
);

-- What a post says, to whoever is asking, and the app reads THIS rather than
-- `post`. A post taken down comes back as a row with an EMPTY body -- so a
-- thread can say that something was removed without saying what it was.
--
-- Hiding the row was the first shape of it. That is right for a timeline and
-- wrong inside a conversation: the replies to it are still there, answering
-- something that is not, and a reader cannot tell "taken down" from "never
-- existed". A thread with a hole in it is the app losing an argument it
-- should be winning -- something was removed, and saying so is the point of
-- removing it.
--
-- This view is a DEFINER view, which is the one kind this file has, and it is
-- deliberate. post_read above will not hand a hidden row to anybody, so a
-- view that asked as the caller could not see one either and would have
-- nothing to blank. Running as the owner it sees every row and does the
-- blanking itself -- and the blanking is the whole of what post_read says, so
-- the two agree by saying the same sentence rather than by one of them being
-- skipped. Nothing else about a post is restricted anywhere in this file, so
-- there is nothing else for this to have gone around. `hidden_why` is not a
-- column of it: why a post went is the reports screen's and the notice's.
--
-- The author and the staff are handed the post itself. The author has to be
-- told by their own post rather than by it turning into a stranger's
-- tombstone, and staff have to be able to read what they are deciding about.
create or replace view post_seen as
  select id, author, language, prompt, reply_to, created_at, hidden_at,
         case when hidden_at is null or author = auth.uid() or is_staff()
              then body else '{}'::jsonb end as body
    from post;
grant select on post_seen to anon, authenticated;

-- post: everyone reads, you write as yourself.
--
-- Everything is world-readable for now; locked accounts come later. When they
-- do, the read policy below is one of two places that change, and the other is
-- the one worth knowing about in advance: a locked account needs following to
-- be a request rather than an act, so follow grows an accepted column and its
-- insert policy stops being "you may follow anyone". That is the real cost of
-- the feature, and it is a column and a policy rather than a redesign.
-- Everyone reads, except what has been taken down -- which its own author
-- still reads, and staff still reads. The author keeps it so that a post going
-- quiet is something they can see rather than something they have to notice:
-- www/post.js puts a line on it saying so. Staff keeps it because a decision
-- that cannot be looked at again cannot be undone.
-- A post taken down is not handed to anybody through THIS table, and that is
-- what makes post_seen below safe to grant. Opening this instead was the
-- first shape of it and was wrong twice over: the words somebody was
-- reported for went out on the wire to anybody with the publishable key, and
-- a view is only a wall if there is no door beside it.
drop policy if exists post_read on post;
create policy post_read on post for select using (
  hidden_at is null or author = auth.uid() or is_staff()
);
drop policy if exists post_make on post;
create policy post_make on post for insert with check (is_member() and author = auth.uid());
drop policy if exists post_edit on post;
create policy post_edit on post for update
  using (is_member() and author = auth.uid()) with check (author = auth.uid());
drop policy if exists post_drop on post;
create policy post_drop on post for delete using (is_member() and author = auth.uid());

-- quote: readable by everyone, because the count is the point. Written only by
-- the author of the post it sits in -- so nobody can inflate somebody else's
-- citations, or their own by writing rows against a post that is not theirs.
drop policy if exists quote_read on quote;
create policy quote_read on quote for select using (true);
drop policy if exists quote_make on quote;
create policy quote_make on quote for insert with check (
  is_member()
  and exists (select 1 from post p where p.id = post and p.author = auth.uid())
);
drop policy if exists quote_drop on quote;
create policy quote_drop on quote for delete using (
  is_member()
  and exists (select 1 from post p where p.id = post and p.author = auth.uid())
);

-- react: everyone reads, because the count under a post is the point. You add
-- and remove your OWN reaction and nobody else's -- so a like cannot be put in
-- somebody else's name and cannot be taken out of it either. No update policy,
-- so a row cannot be turned into a different kind under a different name.
drop policy if exists react_read on react;
create policy react_read on react for select using (true);
drop policy if exists react_make on react;
create policy react_make on react for insert
  with check (is_member() and actor = auth.uid());
drop policy if exists react_drop on react;
create policy react_drop on react for delete using (is_member() and actor = auth.uid());

-- prompt: everyone reads. Nothing else -- no insert, no update, no delete
-- policy exists, so the day's sentence can only come from the service role.
drop policy if exists prompt_read on prompt;
create policy prompt_read on prompt for select using (true);

-- block: YOURS and nobody else's, in every direction. Not `using (true)` like
-- every other read here: who has blocked whom is the one thing on this server
-- that is nobody's business but the person who did it. A policy that let the
-- blocked party read it would make being blocked something they find out.
drop policy if exists block_read on block;
create policy block_read on block for select using (actor = auth.uid());
drop policy if exists block_make on block;
create policy block_make on block for insert
  with check (is_member() and actor = auth.uid());
drop policy if exists block_drop on block;
create policy block_drop on block for delete using (is_member() and actor = auth.uid());

-- report: written by anybody, read by staff. Not by the person who wrote it and
-- not by the person it is about -- somebody who could read reports could work
-- out who reported them, and that is true of the reporter too, who would learn
-- which of their reports had been answered and which had not.
--
-- It used to have no select policy at all, which meant the only way to see a
-- report was the Supabase dashboard. Acting on one within a day is a condition
-- of being in the App Store, and a condition nobody can meet from a laptop
-- they are not sitting at.
--
-- No update and no delete either, for anybody: a report that can be withdrawn
-- by the person it is about is not a report, and one that staff can delete is
-- a record of what was decided that does not survive the deciding.
drop policy if exists report_read on report;
create policy report_read on report for select using (is_staff());
drop policy if exists report_make on report;
create policy report_make on report for insert
  with check (is_member() and actor = auth.uid());

-- follow: everyone sees who follows whom; you add and remove your own following
drop policy if exists follow_read on follow;
create policy follow_read on follow for select using (true);
drop policy if exists follow_make on follow;
create policy follow_make on follow for insert
  with check (is_member() and follower = auth.uid());
drop policy if exists follow_drop on follow;
create policy follow_drop on follow for delete using (is_member() and follower = auth.uid());


-- ---------------------------------------------------------------------------
-- The bytes: photographs and the voice
--
-- A post's pictures are data URLs on the phone and a voice is a file in
-- Documents. Neither may go into `post.body`. A four-photograph post is most
-- of a megabyte of base64, and a timeline of fifty of them is a phone
-- downloading forty megabytes in order to draw six of them -- which is not a
-- timeline, it is a wait. 「Xとかインスタとかと同じ動きにしてね」 is one
-- sentence about how it feels and one about where the bytes are, and they are
-- the same sentence: X shows you the text at once and fills the pictures in
-- as they arrive, and it can do that because the picture is a URL.
--
-- So the post carries paths, and the bytes live in Storage.
--
--   post-media/<author uuid>/<post uuid>/0.jpg   the photographs, in order
--   post-media/<author uuid>/<post uuid>/vo.m4a  the voice
--
-- The FIRST folder is the author's uuid and that is the whole of the write
-- rule: you may put a file under your own uuid and nowhere else. It is checked
-- with a `like`, not with storage.foldername(), because foldername() is
-- Supabase's own function and this file has to be runnable -- and testable --
-- against a plain PostgreSQL. A rule that can only be checked in production is
-- a rule nobody has checked.
--
-- Public to read. A post is world-readable (post_read above) and a picture on
-- one is part of the post; a signed URL per picture would be a round trip per
-- picture for something anybody can already fetch by reading the post.
--
-- The letters somebody drew on a photograph are INSIDE the jpeg before it ever
-- gets here (tools/post-check counts the pixels). Nothing about that changes:
-- what is uploaded is the baked picture.
-- The bucket, and who may touch what is in it.
--
-- One thing to run. `storage.objects` belongs to `supabase_storage_admin` and
-- not to the role the SQL editor runs as, so the two lines that need to OWN
-- that table -- `enable row level security` -- come back as
--
--     ERROR: 42501: must be owner of table objects
--
-- and, landing in the middle of the file, took the whole half after them with
-- them. They are the only two statements in this file that need ownership,
-- and on a hosted project they are not needed at all: Supabase switches row
-- level security on for storage itself, before anybody runs anything.
--
-- So they are attempted and a refusal is swallowed. A plain PostgreSQL --
-- tools/rls-check.mjs -- owns these tables, runs them, and is therefore
-- testing the same thing a hosted project is already in. Everything else
-- below is an ordinary statement that runs on both.
do $storage$
begin
  alter table storage.objects enable row level security;
  -- And the list of buckets, which nothing in the app reads. No policy
  -- follows, so it is closed -- which is what it should be.
  alter table storage.buckets enable row level security;
exception when insufficient_privilege then
  raise notice 'storage row level security is already on; this role does not own the table and does not need to.';
end
$storage$;

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- Anybody reads what is in this bucket, and only this bucket.
drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select
  using (bucket_id = 'post-media');
-- You write under your own uuid and nowhere else.
drop policy if exists media_make on storage.objects;
create policy media_make on storage.objects for insert with check (
  is_member() and bucket_id = 'post-media'
  and name like auth.uid()::text || '/%'
);
-- And you delete your own. Deleting a post deletes its pictures with it --
-- the row goes by cascade and the bytes go by this, from the phone, in the
-- same breath. Nothing here removes anybody's file on a schedule:
-- docs/DATA_SAFETY.md forbids automatic deletion and there is no job.
drop policy if exists media_drop on storage.objects;
create policy media_drop on storage.objects for delete using (
  is_member() and bucket_id = 'post-media'
  and name like auth.uid()::text || '/%'
);
-- No update policy. A picture is not edited; a different picture is a
-- different path, and an overwrite is how somebody else's post quietly
-- changes under them.

-- ---------------------------------------------------------------------------
-- What happened to you
--
-- Four questions with one answer, and it is a function rather than four
-- requests because a notice list is ONE list in time order -- a phone asking
-- four times and merging them would be sorting a page it does not have all of.
--
-- It runs as whoever calls it (no `security definer`), so every row it can see
-- is a row the policies above already let them see: react, post, profile and
-- follow are all world-readable. Nothing here opens a door; it walks through
-- the ones that are open and puts the results in order.
--
-- Your own doing is not news. `actor <> auth.uid()` on each of the four, so
-- liking your own post, or answering yourself, does not arrive as a notice.
--
-- 'pick' is in www/net.js's list and not here: a post worth reading is not
-- somebody doing something to you, and it is the one of the five this phone
-- could never work out on its own. It comes from us, later, or not at all.
create or replace function notices(lim int default 50)
returns table (kind text, at timestamptz, hd text, who text, av jsonb, post uuid)
language sql stable as $$
  select 'like', r.created_at, p.handle, p.display, p.av, r.post
    from react r
    join post ps on ps.id = r.post
    join profile p on p.id = r.actor
   where ps.author = auth.uid() and r.actor <> auth.uid() and r.kind = 'like'
  union all
  select 'boost', r.created_at, p.handle, p.display, p.av, r.post
    from react r
    join post ps on ps.id = r.post
    join profile p on p.id = r.actor
   where ps.author = auth.uid() and r.actor <> auth.uid() and r.kind = 'boost'
  union all
  select 'reply', q.created_at, p.handle, p.display, p.av, q.id
    from post q
    join post ps on ps.id = q.reply_to
    join profile p on p.id = q.author
   where ps.author = auth.uid() and q.author <> auth.uid()
  union all
  select 'follow', f.created_at, p.handle, p.display, p.av, null::uuid
    from follow f
    join profile p on p.id = f.follower
   where f.followed = auth.uid()
  order by 2 desc
  limit lim
$$;
grant execute on function notices(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Leaving
--
-- Signing out is not here, because signing out is not a change to anything:
-- the account stays, the languages stay, and signing back in finds them. Only
-- deletion needs writing down, and only because it reaches auth.users, which
-- no policy in this file can.
--
-- It takes no argument. A deletion with options is how the last version of
-- this ended up with a language that outlived the person who asked for it to
-- be gone. Everything of theirs goes: the languages cascade from the profile,
-- the posts and follows and publication records with them.
-- ---------------------------------------------------------------------------
create or replace function account_delete()
returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = me;
end $$;
revoke all on function account_delete() from public;
grant execute on function account_delete() to authenticated;

-- ---------------------------------------------------------------------------
-- Answering a report
--
-- Two functions rather than an update policy, because a policy that let staff
-- update a post would let staff rewrite what somebody said. These reach one
-- pair of columns and nothing else.
--
-- `security definer` for the same reason account_delete() is: the caller is a
-- normal account whose own policies do not let it touch somebody else's row.
-- is_staff() is asked inside, so the definer rights are not a way in.
-- ---------------------------------------------------------------------------
create or replace function post_hide(p uuid, reason text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not staff'; end if;
  update post set hidden_at = now(), hidden_why = reason where id = p;
end $$;
revoke all on function post_hide(uuid, text) from public;
grant execute on function post_hide(uuid, text) to authenticated;

-- The other direction, which is why hiding is not deleting.
create or replace function post_show(p uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not staff'; end if;
  update post set hidden_at = null, hidden_why = null where id = p;
end $$;
revoke all on function post_show(uuid) from public;
grant execute on function post_show(uuid) to authenticated;

-- Ejecting somebody, which is the other half of answering a report and is the
-- half App Store guideline 1.2 asks for by name. Taking the post down leaves
-- whoever wrote it free to write it again.
--
-- It is not a deletion and it is not a sign-out. is_member() above stops
-- everything they would WRITE and nothing they can read, and account_delete()
-- goes on working: being thrown out is not a reason to be trapped inside.
create or replace function account_ban(p uuid, reason text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not staff'; end if;
  -- Which would be a mistake and not an intention. Unbanning yourself would
  -- still work -- is_staff() is a different question from is_member() -- so
  -- this is a guard against a slip, not against being locked out.
  if p = auth.uid() then raise exception 'not yourself'; end if;
  update profile set banned_at = now(), banned_why = reason where id = p;
end $$;
revoke all on function account_ban(uuid, text) from public;
grant execute on function account_ban(uuid, text) to authenticated;

create or replace function account_unban(p uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not staff'; end if;
  update profile set banned_at = null, banned_why = null where id = p;
end $$;
revoke all on function account_unban(uuid) from public;
grant execute on function account_unban(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The columns nobody may write
--
-- Row level security says which ROWS an account may change. It has nothing to
-- say about which columns, so `profile_edit` -- "you may edit yourself" -- was
-- also "you may make yourself staff" and "you may lift your own ban", and
-- `post_edit` -- "you may edit your own post" -- was also "you may put your own
-- post back up". Each is one UPDATE with one extra field in it.
--
-- Column privileges are the tool for that, and they have to be said this way
-- round: revoking one column from a role that holds UPDATE on the whole table
-- does nothing at all (PostgreSQL warns and carries on), because the
-- table-level grant covers every column there is and every column there will
-- be. So the table-level grant goes, and what may be updated is named.
--
-- Which means a column added later is not updatable until it is added to one
-- of these lines. That is the right way round -- a new column is not writable
-- by accident -- and it is why the lines list what the policies above are
-- ABOUT rather than "everything except the two".
--
-- service_role is not touched. The dashboard is where staff is set.
-- Said after the tables and the policies because the columns have to exist.
-- ---------------------------------------------------------------------------
revoke update on profile from anon, authenticated;
grant  update (handle, display, av) on profile to anon, authenticated;
revoke update on post from anon, authenticated;
grant  update (body, language, prompt, reply_to) on post to anon, authenticated;
