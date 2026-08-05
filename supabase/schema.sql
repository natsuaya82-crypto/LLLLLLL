-- ---------------------------------------------------------------------------
-- Lingua — what the server holds, and who may touch it.
--
-- NOT APPLIED. This is for reading before it is run once against an empty
-- project. Locked accounts come later, and the note on the post policy says
-- what they will cost.
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
create table profile (
  id          uuid primary key references auth.users on delete cascade,
  handle      text unique not null check (handle ~ '^[a-z0-9_]{2,24}$'),
  display     text,
  created_at  timestamptz not null default now()
);

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
create table language (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid not null references profile(id) on delete cascade,
  name         text not null default '',
  -- what the author says others may do with the font and the glyphs. The app
  -- shows this; it does not enforce it. We are the record, not the arbiter.
  license      text not null default 'ask'
               check (license in ('ask', 'personal', 'free')),
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
create index language_owner_idx on language(owner);
create index language_published_idx on language(published_at) where published_at is not null;

-- The record that settles arguments without anybody having to judge one.
-- Append only: no update policy and no delete policy exist for this table, so
-- a row cannot be altered by anyone through the API, including its author.
-- Nine tenths of "he took my script" is answered by a timestamp.
create table publication (
  id        bigint generated always as identity primary key,
  language  uuid not null references language(id) on delete cascade,
  actor     uuid references profile(id) on delete set null,
  kind      text not null check (kind in ('language', 'glyphs', 'post')),
  digest    text not null,          -- sha-256 of exactly what was published
  at        timestamptz not null default now()
);
create index publication_language_idx on publication(language, at desc);

-- ---- said ------------------------------------------------------------------
-- A post is a thing somebody said, once. body holds the runs of text and the
-- glyph outlines they were drawn with AT THE TIME -- frozen, because a post is
-- a record of an utterance and the author of the language may redraw a letter
-- tomorrow. The outlines are stored once per post and referenced per letter,
-- so a long post in a 30-letter alphabet carries 30 shapes, not 300.
create table post (
  id         uuid primary key default gen_random_uuid(),
  author     uuid not null references profile(id) on delete cascade,
  language   uuid references language(id) on delete set null,
  body       jsonb not null,
  -- the day's sentence this answers, when it answers one. Most posts do not:
  -- a post is whatever somebody felt like saying.
  prompt     bigint references prompt(id) on delete set null,
  created_at timestamptz not null default now()
);
create index post_prompt_idx on post(prompt, created_at desc);
create index post_author_idx on post(author, created_at desc);
create index post_language_idx on post(language, created_at desc);

-- A word taken from somebody else's language and used in a post. This is the
-- citation, and it is a table rather than a field in body because it is the
-- thing being counted: how often a language is spoken by people who did not
-- make it is the one number that says whether any of this worked.
create table quote (
  post      uuid not null references post(id) on delete cascade,
  language  uuid not null references language(id) on delete cascade,
  word      text not null,
  primary key (post, language, word)
);
create index quote_language_idx on quote(language);

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
create table prompt (
  id      bigint generated always as identity primary key,
  on_day  date not null unique,        -- one a day, and the unique says so
  text    text not null,               -- English, and translated on the device
  created_at timestamptz not null default now()
);

create table follow (
  follower   uuid not null references profile(id) on delete cascade,
  followed   uuid not null references profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followed),
  check (follower <> followed)
);

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
alter table prompt      enable row level security;
alter table follow      enable row level security;

-- A signed-in account that is not an anonymous one.
create or replace function is_member() returns boolean
language sql stable as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
$$;

-- profile: everyone reads, you write yourself into existence and edit yourself
create policy profile_read on profile for select using (true);
create policy profile_make on profile for insert with check (is_member() and id = auth.uid());
create policy profile_edit on profile for update using (is_member() and id = auth.uid())
                                              with check (id = auth.uid());

-- language: a published one is readable by anyone; an unpublished one only by
-- the person who owns it. Only the owner ever writes.
create policy language_read on language for select
  using (published_at is not null or owner = auth.uid());
create policy language_make on language for insert
  with check (is_member() and owner = auth.uid());
create policy language_edit on language for update
  using (is_member() and owner = auth.uid()) with check (owner = auth.uid());
create policy language_drop on language for delete
  using (is_member() and owner = auth.uid());

-- publication: everyone reads the record. Anyone may add to it about their own
-- language. NOBODY updates or deletes it -- those policies do not exist, which
-- is what makes it a record rather than a claim.
create policy publication_read on publication for select using (true);
create policy publication_make on publication for insert with check (
  is_member() and actor = auth.uid()
  and exists (select 1 from language l where l.id = language and l.owner = auth.uid())
);

-- post: everyone reads, you write as yourself.
--
-- Everything is world-readable for now; locked accounts come later. When they
-- do, the read policy below is one of two places that change, and the other is
-- the one worth knowing about in advance: a locked account needs following to
-- be a request rather than an act, so follow grows an accepted column and its
-- insert policy stops being "you may follow anyone". That is the real cost of
-- the feature, and it is a column and a policy rather than a redesign.
create policy post_read on post for select using (true);
create policy post_make on post for insert with check (is_member() and author = auth.uid());
create policy post_edit on post for update
  using (is_member() and author = auth.uid()) with check (author = auth.uid());
create policy post_drop on post for delete using (is_member() and author = auth.uid());

-- quote: readable by everyone, because the count is the point. Written only by
-- the author of the post it sits in -- so nobody can inflate somebody else's
-- citations, or their own by writing rows against a post that is not theirs.
create policy quote_read on quote for select using (true);
create policy quote_make on quote for insert with check (
  is_member()
  and exists (select 1 from post p where p.id = post and p.author = auth.uid())
);
create policy quote_drop on quote for delete using (
  is_member()
  and exists (select 1 from post p where p.id = post and p.author = auth.uid())
);

-- follow: everyone sees who follows whom; you add and remove your own following
-- prompt: everyone reads. Nothing else -- no insert, no update, no delete
-- policy exists, so the day's sentence can only come from the service role.
create policy prompt_read on prompt for select using (true);

create policy follow_read on follow for select using (true);
create policy follow_make on follow for insert
  with check (is_member() and follower = auth.uid());
create policy follow_drop on follow for delete using (is_member() and follower = auth.uid());


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
