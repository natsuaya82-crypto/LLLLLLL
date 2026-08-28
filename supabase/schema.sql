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

-- And the one above it, which is a different question: not "may this account
-- answer a report" but "may this account decide WHO answers reports". One
-- person holds it -- 「俺は権限者で他はスタッフみたいな感じで」 -- and nothing
-- in this file ever takes it away, because the failure it exists to prevent is
-- the owner being locked out of their own app by somebody they made staff.
--
-- Not called `owner`: language.owner already means "the account a language
-- belongs to", and a word that means two things in one schema is a word that
-- will be read as the wrong one. It is called what the screen it opens is
-- called.
--
-- The comment over `staff` says that the day it has to answer a second
-- question it should become a table rather than a second boolean. This is not
-- that day: `staff` is still answering exactly the one question it answered
-- before, and is_staff() -- which two policies, one view and four functions
-- ask -- is not touched by a single character. A role table would have meant
-- rewriting it, and rewriting the sentence that IS the security of the
-- moderation side in order to add a row above it is the wrong trade. If a
-- third tier is ever wanted, that is the day.
alter table profile add column if not exists admin boolean not null default false;

-- And whoever has been ejected. A timestamp rather than a boolean beside a
-- date, for the same reason post.hidden_at is one: two columns that have to
-- agree about whether something happened are two columns that can disagree.
--
-- What it does is one line in is_member() below, which every write policy in
-- this file now asks.
--
-- It used to stop the timeline and not the work. The line over it said
-- 「制作は好きにやらせればいいし、sns止められても作りたいやつは作るでしょ」 and
-- a frozen account went on writing its own language, because that was nobody
-- else's business. **OWNER DECISION 2026-08-26 replaced that**: asked directly
-- whether a frozen account may still edit its language, the answer was that it
-- may not. A language is handed to other people now -- it can be downloaded and
-- it can be put on a page anybody may open -- so "nobody else's business" is
-- not what a language is any more, and the sentence it rested on has gone with
-- it.
--
-- What a frozen account keeps: reading, everything already on the phone, and
-- the way out. account_delete() does not ask is_member() and must not -- being
-- thrown out of a place is not a reason to be locked out of the door marked
-- exit -- and nothing here reaches localStorage, so what somebody has made
-- goes on opening, editing and backing up on the phone it was made on. What
-- stops is the copy going up.
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
  text    text not null,               -- English. The canonical one, and the
                                       -- fallback when `says` has no entry
  created_at timestamptz not null default now()
);
-- The same sentence in each interface language:
--   {"en":"It is unbearably hot today.","ja":"今日はめちゃくちゃ暑い。", ...}
--
-- This column arrived after the table did, and it is ADDED rather than
-- replacing `text`. The line above used to say "English, and translated on
-- the device", which was a true description of a design where everybody read
-- the same English sentence and the translating was the activity. The owner
-- decided otherwise on 2026-08-23: the day's sentence is shown in the
-- person's own interface language, because a Japanese speaker reading an
-- English prompt is doing two translations, and only the second one is the
-- game. `text` stays, so nothing that was written is lost and a row with no
-- `says` still shows something.
--
-- `if not exists` because this file is run again over a database that
-- already has the table -- the same reason every create and every policy
-- above is written to be re-runnable.
alter table prompt add column if not exists says jsonb not null default '{}'::jsonb;

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

-- ---- not said yet ----------------------------------------------------------
-- A draft. What somebody has written and not sent.
--
-- 「SNSは全部サーバー」 OWNER, said again on 2026-08-27. A draft is the
-- timeline's, so it lives here and the phone keeps the copy that works with no
-- signal -- the same sentence `post` is under, and CLAUDE.md § Online is where
-- it is written down.
--
-- A TABLE OF ITS OWN, and not a column on `post`. `post_read` is
-- `hidden_at is null or author = auth.uid() or is_staff()` -- everything not
-- taken down is readable by anybody signed in -- so a draft kept in `post`
-- is published unless every road that reads a post says "and not a draft",
-- and a road that forgets to say it breaks NOTHING: the screen is right, the
-- screenshots are right, and npm test is green, because there is only ever
-- one person in a test. Here there is no such road to forget. Three tables
-- reference post(id) as well -- quote, react, report -- and in the other
-- shape a draft is a row somebody can like.
--
-- And a draft is not a post that has not happened yet. A post is frozen at the
-- moment it is said (`body` above); a draft is the thing that keeps changing,
-- and it carries no `ink` at all, because ink is cut onto a post as it is
-- sent (CLAUDE.md rule 13).
--
-- `author` and not `owner`, the same word `post` uses for the same thing.
-- Cascading from `profile`, which is what makes account deletion reach this:
-- account_delete() at the foot of this file removes the auth.users row and
-- everything of that person's follows it down. 「アカウント削除で残るものねえ
-- って言ってんだろ何回言わせんだよ全部消える」 OWNER.
--
-- The id is minted on the PHONE, the way netPush() mints a post's, because a
-- draft has to have the name it will be known by from the moment it is
-- written -- including when it is written with no signal and goes up later.
create table if not exists draft (
  id         uuid primary key,
  author     uuid not null references profile(id) on delete cascade,
  body       jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists draft_author_idx on draft(author, updated_at desc);

-- ---- looked for, and kept -------------------------------------------------
-- A search somebody starred. 「SNSは全部サーバー」 OWNER -- a search is
-- something a person keeps, so it is theirs on the server and not a habit one
-- phone remembers.
--
-- The WORDS and not the results. What a saved search means is "ask this
-- again", and a list of ids frozen on the day it was starred would be the one
-- thing it must not be: a search that stopped searching.
--
-- Nobody else's business, the same as `draft` and for a weaker but real
-- reason: what somebody looks for says as much about them as what they write.
-- All four policies are the author's.
--
-- `unique (author, q)` so starring the same words twice is the same star
-- rather than two rows that must then be told apart. It also makes the words
-- the name of the row -- the phone can drop one by what it says, which is
-- what it has in hand, without first asking what its id is.
create table if not exists saved_search (
  id         uuid primary key default gen_random_uuid(),
  author     uuid not null references profile(id) on delete cascade,
  q          text not null check (q <> '' and length(q) <= 200),
  created_at timestamptz not null default now(),
  unique (author, q)
);
create index if not exists saved_search_author_idx
  on saved_search(author, created_at desc);

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
-- Anonymous accounts can read and cannot write anything at all. Supabase gives
-- an anonymous sign-in a real uid, so "not signed in" is not the test -- the
-- JWT carries is_anonymous, and that is what every writing policy checks
-- through is_member().
--
-- The app does not make one any more (OWNER 2026-08-26), so this is a wall
-- with nobody standing at it. It stays because the switch that opens that
-- endpoint is in the Supabase dashboard rather than in this file.
--
-- This paragraph used to end: "when they register, the same uid is linked and
-- nothing they did is lost." **That was never true of this app.** netSignUp()
-- in www/net.js posts to /auth/v1/signup with no session token on it, which is
-- how Supabase is asked for a NEW user rather than for an identity on the one
-- already here -- so registering made a second uid and left the first one's
-- rows behind it. Nothing was ever lost by it, because no anonymous account
-- has ever existed outside a test build, and there is nothing to fix now that
-- the app has stopped making them. It is written down because a sentence that
-- describes a mechanism nobody built is the kind of thing the next person
-- builds on.
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
alter table draft       enable row level security;
alter table saved_search enable row level security;

-- One question, and until 2026-08-26 there were two.
--
-- There used to be an anonymous account made at first launch, and "may this
-- account write" split along what the write was FOR: has_account() -- anybody
-- at all, anonymous included -- guarded a language and the slices under it, on
-- the grounds that those were nobody else's business; is_member() guarded
-- everything other people would see.
--
-- **The split was drawn along "can anybody else see this", and that line has
-- moved.** A language can be handed to somebody else now (DL), and it can be
-- put on a page anybody may open (the publish switch), and what a person makes
-- is kept on the server rather than only on the phone. So a language is not
-- "nobody else's business" any more, and there is nothing left for the two
-- questions to be about.
--
-- OWNER DECISION 2026-08-26: 「言語はアカウントないと作れないです」
-- 「ログインした人しか書けないけど」「二種類になる意味も分からないけど」
-- This replaces the anonymous-first decision of 2026-08-22.
--
-- So has_account() is gone rather than left sitting unused, and every policy
-- that asked it asks is_member(). is_member() itself is not touched: ten
-- policies are standing on it and this change is about who else joins them.
--
-- A signed-in account that is not an anonymous one, and has not been frozen.
--
-- The anonymous clause stays, and not for anybody's sake -- there is nobody:
-- the app has never been released, so no phone anywhere holds an anonymous
-- session. 「リリースしてないんだからアカウンとないでしょ」 -- OWNER 2026-08-26.
-- It stays because this is a wall and not a preference. Anonymous sign-in is a
-- switch in the Supabase dashboard, not a thing this file can see; if it is on
-- -- today, or in a year, by somebody setting up a second project -- the
-- endpoint answers, and what stops that session writing is this line and
-- nothing else. Ten policies stand on this function and none of them says the
-- word anonymous.
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

-- And the one account above that. Same shape, same reading, one column over.
create or replace function is_admin() returns boolean
language sql stable as $$
  select exists (select 1 from profile where id = auth.uid() and admin)
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
-- is_member(), the same question posting asks. 「言語はアカウントないと作れない
-- です」「ログインした人しか書けないけど」 -- OWNER 2026-08-26. It used to be
-- has_account(), which anonymous satisfied, on the grounds that a language was
-- nobody else's business until it was published. It is not: it can be handed
-- over whole, and it can be put on a page anybody may open, so making one and
-- posting one are the same kind of act and ask the same thing.
--
-- Reading does not ask it, and that is not an oversight: a published language
-- is readable by anybody at all, including somebody with no account, which is
-- what publishing one MEANS.
drop policy if exists language_read on language;
create policy language_read on language for select
  using (published_at is not null or owner = auth.uid());
drop policy if exists language_make on language;
create policy language_make on language for insert
  with check (is_member() and owner = auth.uid());
drop policy if exists language_edit on language;
create policy language_edit on language for update
  using (is_member() and owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists language_drop on language;
create policy language_drop on language for delete
  using (is_member() and owner = auth.uid());

-- slice: published means published, and the rest stays its owner's.
--
-- 「この言語については公開したら公開、非公開にしたら非公開だけどそれ以外に
--   あんのか？」 OWNER 2026-08-28. Two states and no third, so this is one
-- flag and not a set of them.
--
-- WHAT OPENS IS THE FIVE THE ABOUT PAGE READS: the article itself (`wld`),
-- the writing system, the sounds, the letters and the keyboard. Those are
-- what vAbout() draws, and drawing them for somebody else is the whole of
-- what publishing a language page is.
--
-- THE DICTIONARY AND THE GRAMMAR DO NOT OPEN. 「言語ページ公開と単語や文字の
-- dl可能は別だし」 OWNER -- being allowed to READ somebody's page and being
-- handed the months of work behind it are two questions, and publishing the
-- page answers only the first. `words`, `phases`, `gram2`, `lines`, `notes`,
-- `talk` and `lang` are nobody else's at any setting.
--
-- `published_at` is what the About page's own switch writes -- setWldHide()
-- in www/home.js through netLangPublic() in www/net.js. Turning the switch
-- off writes null back and the door shuts: nothing is destroyed, nothing is
-- copied, and the page comes back exactly as it was left.
--
-- Writing is unchanged and is the owner's alone. Publishing is a page being
-- readable, never a way in.
alter table slice enable row level security;
drop policy if exists slice_read on slice;
create policy slice_read on slice for select
  using (
    exists (select 1 from language l
             where l.id = language and l.owner = auth.uid())
    or (kind in ('wld', 'script', 'snd', 'letters', 'kb')
        and exists (select 1 from language l
                     where l.id = language and l.published_at is not null))
  );
drop policy if exists slice_make on slice;
create policy slice_make on slice for insert
  with check (is_member() and exists (select 1 from language l
                  where l.id = language and l.owner = auth.uid()));
drop policy if exists slice_edit on slice;
create policy slice_edit on slice for update
  using (is_member() and exists (select 1 from language l
                  where l.id = language and l.owner = auth.uid()))
  with check (exists (select 1 from language l
                  where l.id = language and l.owner = auth.uid()));
drop policy if exists slice_drop on slice;
create policy slice_drop on slice for delete
  using (is_member() and exists (select 1 from language l
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
--
-- `author_out` is the one thing on here that is not the post's: whether the
-- account that wrote it is frozen. It is on the ROW because that is how the
-- reading side works everywhere in this app -- what a reader needs is put on
-- the post -- and because the alternative is the phone asking about every
-- author it sees. A frozen account's posts come off the timeline and stay
-- readable on the account's own page; the app decides which, and this is
-- what it decides with.
create or replace view post_seen as
  select p.id, p.author, p.language, p.prompt, p.reply_to, p.created_at,
         p.hidden_at,
         (a.banned_at is not null) as author_out,
         case when p.hidden_at is null or p.author = auth.uid() or is_staff()
              then p.body else '{}'::jsonb end as body
    from post p left join profile a on a.id = p.author;
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

-- draft: yours, and nobody else's -- READING INCLUDED.
--
-- This is the one policy block in this file where `select` is not `using
-- (true)` or something close to it, and that is the whole point of the table
-- existing. A draft is what somebody has written and NOT decided to say. Every
-- other row here is either already public or on its way to being public; this
-- one is the only thing in the app that is private by intention, so the read
-- is locked to the author the same way the write is.
--
-- All four say the same sentence, and they say it separately because a policy
-- is per command: `for all` would have been one line and one place to be
-- wrong, and `using` on an insert is not checked at all. `is_member()` and not
-- just `auth.uid() = author`, for the reason every other write here asks it --
-- an anonymous session and a frozen account are both signed in.
--
-- `with check` on the update as well as `using`: without it, the author of a
-- row may hand it to somebody else by writing their uuid into `author`, and
-- what they would be handing over is a draft that person never wrote.
--
-- tools/rls-check.mjs is where somebody tries all four and cannot. A policy
-- with no attempt against it is a policy nobody has read -- and a policy that
-- is too wide throws nothing, so that file is the only thing holding this.
drop policy if exists draft_read on draft;
create policy draft_read on draft for select using (is_member() and author = auth.uid());
drop policy if exists draft_make on draft;
create policy draft_make on draft for insert with check (is_member() and author = auth.uid());
drop policy if exists draft_edit on draft;
create policy draft_edit on draft for update using (is_member() and author = auth.uid())
                                            with check (author = auth.uid());
drop policy if exists draft_drop on draft;
create policy draft_drop on draft for delete using (is_member() and author = auth.uid());

-- saved_search: the same four sentences `draft` makes, for the same reason.
-- What somebody looks for is theirs, reading included.
drop policy if exists saved_read on saved_search;
create policy saved_read on saved_search for select using (is_member() and author = auth.uid());
drop policy if exists saved_make on saved_search;
create policy saved_make on saved_search for insert with check (is_member() and author = auth.uid());
drop policy if exists saved_edit on saved_search;
create policy saved_edit on saved_search for update using (is_member() and author = auth.uid())
                                                  with check (author = auth.uid());
drop policy if exists saved_drop on saved_search;
create policy saved_drop on saved_search for delete using (is_member() and author = auth.uid());

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
-- ONE ROW PER THING, not one per person. 「同じ投稿のいいねとかは X みたいに
-- まとめていい」 OWNER 2026-08-28, and 「同じでいい」 for follows.
--
-- Folded HERE and not on the phone, and that is the whole point of it being
-- here: fifty rows fetched and then folded on the phone is fifty rows that
-- become twenty, and the person sees LESS than they did. Folded first, fifty
-- rows are fifty things that happened. 「50件でいい」 OWNER, so there is no
-- road past them and none is built.
--
-- Grouped by (kind, post). Follows carry no post and GROUP BY puts every NULL
-- in one group, which is exactly right: they are one row saying how many
-- people. Replies are grouped by the REPLY's own id, so they never fold into
-- each other -- two answers are two things to read, and the id is what
-- pressing the row opens.
--
-- What a row carries: the newest person, by the same three fields as before
-- (`hd`, `who`, `av`), so a screen that has not been changed yet still draws
-- something true; `n`, how many people, which is 1 for a thing one person
-- did; and `more`, the next few after the newest, newest first, as
-- [{hd, who, av}]. `n` and `more` are what "〇〇さん他3人" is made of.
--
-- `count(*)` is a count of PEOPLE without having to say so: react's primary
-- key is (post, actor, kind), so one person cannot like one post twice, and a
-- follow is one row per pair.
--
-- Dropped and remade rather than replaced: the returning shape changed, and
-- `create or replace` will not do that. `if exists` so the file goes on being
-- applied twice in a row.
drop function if exists notices(int);
create or replace function notices(lim int default 50)
returns table (kind text, at timestamptz, hd text, who text, av jsonb,
               post uuid, n int, more jsonb)
language sql stable as $$
  with ev as (
    select 'like'::text as kind, r.created_at as at, r.actor as actor, r.post as post
      from react r
      join post ps on ps.id = r.post
     where ps.author = auth.uid() and r.actor <> auth.uid() and r.kind = 'like'
    union all
    select 'boost', r.created_at, r.actor, r.post
      from react r
      join post ps on ps.id = r.post
     where ps.author = auth.uid() and r.actor <> auth.uid() and r.kind = 'boost'
    union all
    select 'reply', q.created_at, q.author, q.id
      from post q
      join post ps on ps.id = q.reply_to
     where ps.author = auth.uid() and q.author <> auth.uid()
    union all
    select 'follow', f.created_at, f.follower, null::uuid
      from follow f
     where f.followed = auth.uid()
  ),
  g as (
    select ev.kind, ev.post, max(ev.at) as at, count(*)::int as n,
           /* `actor` after `at` so two things that happened in the same
              instant still come out in one settled order. Without it the
              person a row is NAMED after is whichever the planner handed
              over first, and that is a name that can change between two
              readings of the same list. */
           (array_agg(ev.actor order by ev.at desc, ev.actor desc))[1:4] as few
      from ev group by ev.kind, ev.post
  )
  select g.kind, g.at, p0.handle, p0.display, p0.av, g.post, g.n,
         coalesce((select jsonb_agg(jsonb_build_object(
                            'hd', p.handle, 'who', p.display, 'av', p.av)
                          order by u.ord)
                     from unnest(g.few[2:4]) with ordinality as u(id, ord)
                     join profile p on p.id = u.id), '[]'::jsonb)
    from g
    join profile p0 on p0.id = g.few[1]
   order by g.at desc
   limit lim
$$;
grant execute on function notices(int) to authenticated;

-- ---------------------------------------------------------------------------
-- What is going round
--
-- 「12時間ごとにバズった順」 OWNER, and 「検索の話題はTwitterと同じアルゴリズム
-- で」. The recommended timeline and the search's 話題 are the SAME list --
-- the owner said so -- so there is one function and not two.
--
-- The weights are decided: a like is 1, a repost is 3, an answer is 5. Somebody
-- who wrote a sentence under your post did more than somebody who tapped a
-- heart, and the numbers say so. The window is the last 48 hours. A tie is
-- broken by the newer post, which is the second half of the owner's sentence
-- and not a detail: without it two posts on the same score swap places every
-- time the list is asked for.
--
-- Read as `post_seen` reads, column for column, so the phone's netRow() does
-- not learn a second shape. `stable` and no `security definer`: it walks the
-- same world-readable tables the timeline already walks, and post's own read
-- policy is what decides that a taken-down post is nobody's business.
--
-- WHAT IS NOT HERE, and both are deliberate:
--
--   Nothing. Both of the halves that were open on 2026-08-28 have been
--   answered and are in: the list stands still between ticks (feed_hot()
--   below, and the note inside it), and the blue mark is worth four
--   (feed_paid_weight()). What is still missing is the COLUMN the mark would
--   be read off, and feed_weight() says what happens on the day it lands.
--
-- `off` and not a timestamp for the continuation: this list is ordered by a
-- score, and a score is not something you can ask for "the ones after". A
-- count is honest about being a count.
-- ---------------------------------------------------------------------------

-- How much a post's author counts for. ONE for everybody today, and this is
-- the whole of the reason it is a function: the day there is a column saying
-- who has paid and a number saying what the mark is worth, this is the line
-- that changes, and nothing else in the file moves.
--
-- The number is NOT decided. It has not been asked of the owner, so it is not
-- invented here -- a made-up multiplier is a made-up ranking, and nobody would
-- be able to tell by looking at the app that it had been guessed.
-- The tick the list turns on. 「4時間ごと。0 4 8 12 16 20 24 これは入れ替わら
-- ない。」 OWNER 2026-08-28 -- so this answers the most recent of those six
-- hours and never anything in between.
--
-- IN UTC, and that is 「時間もお題のページに合わせるってこと」 OWNER. The
-- day's sentence is the page that already had to answer this, and the answer
-- written there is not a zone -- it is that there is no zone arithmetic at
-- all. netDay() asks for the NEWEST row rather than today's, and www/sns.js
-- says why over dayWhen(): "the app does not work out what day it is in
-- California, because that is a timezone rule and a second copy of one is a
-- second one to get wrong. That decision is kept." `prompt.on_day` is a date
-- and the screen draws it in UTC for the same reason.
--
-- So this does not name a zone either. A named zone here would be exactly the
-- second copy that page refused, and it would be a copy that goes wrong twice
-- a year on its own, in a function nobody looks at, changing what the whole
-- app recommends.
--
-- WHAT THIS COSTS, said out loud because it is a real cost and not nothing:
-- the six hours are 0 4 8 12 16 20 UTC, so they are those hours in American
-- local time only while the offset is a whole multiple of four -- true on
-- US Eastern in summer and US Pacific in winter, and four hours out of six
-- otherwise. Two owner sentences pull against each other here and this one
-- follows the later of the two. It is in the report.
create or replace function feed_slot()
returns timestamptz language sql stable as $$
  select date_trunc('hour', now())
         - make_interval(hours => (extract(hour from now())::int % 4))
$$;

-- What a blue mark is worth. FOUR.
--
-- 「Twitterと同じだから青パッチ。上に上がりやすい」 OWNER, and when the number
-- itself was asked for: 「Xと同じアルゴリズムって言ってるよね？」 -- which is
-- not a refusal to answer, it is where the answer is. X published its ranking
-- in 2023 and a paid account's posts are multiplied there: twice among people
-- who follow them, four times when shown to people who do not. This list and
-- the search's 話題 are both places somebody is shown to people who do NOT
-- follow them, so it is the four and not the two.
--
-- A function and not a number inside the ORDER BY, because it is the thing
-- here most likely to be told to be something else, and a number buried in an
-- ordering is a number nobody finds.
create or replace function feed_paid_weight()
returns numeric language sql immutable as $$ select 4::numeric $$;

-- And whether an account carries the mark, which is what the four multiplies.
--
-- IT IS NOBODY, TODAY. No column in this file says who has paid, so this
-- answers one for everybody and the ranking is the reactions alone.
-- www/post.js's postBadge() draws the mark only for `p.mine` and reads
-- can('badge') -- this phone's own plan -- so the only thing that knows is a
-- phone, and a phone that could TELL the server it had paid is an app where
-- anybody marks themselves.
--
-- Asked of the row AS JSONB rather than by naming the column. That is the one
-- odd line in this file and it is deliberate: `to_jsonb(p) ->> 'paid'` is
-- NULL where there is no such column and the boolean where there is, so this
-- begins working the day the column is added and not one edit later. Naming
-- the column instead could not be written at all today -- the function would
-- not compile -- and returning a bare 1 would be a line somebody has to
-- remember to come back to, in a file nobody opens except when something is
-- wrong.
--
-- The column, when it comes: `paid boolean not null default false`, shut the
-- way `staff` and `admin` are -- kept out of the `grant insert (...)` and
-- `grant update (...)` lines at the foot of this file, so nobody can arrive
-- holding it or write it onto themselves -- and set by the server receiving
-- Apple's signed notice. Nothing on a phone ever writes it.
create or replace function feed_weight(who uuid)
returns numeric language sql stable as $$
  select case when coalesce((to_jsonb(p) ->> 'paid')::boolean, false)
              then feed_paid_weight() else 1::numeric end
    from profile p where p.id = who
$$;

create or replace function feed_hot(lim int default 50, off int default 0)
returns table (id uuid, author uuid, language uuid, prompt bigint,
               reply_to uuid, created_at timestamptz, hidden_at timestamptz,
               author_out boolean, body jsonb)
language sql stable as $$
  select v.id, v.author, v.language, v.prompt, v.reply_to, v.created_at,
         v.hidden_at, v.author_out, v.body
    from post_seen v
    left join lateral (
      select coalesce(sum(case r.kind when 'like'  then 1
                                      when 'boost' then 3 end), 0) as pts
        from react r
       where r.post = v.id and r.created_at <= feed_slot()
    ) k on true
    left join lateral (
      select (count(*) * 5) as pts
        from post q
       where q.reply_to = v.id and q.created_at <= feed_slot()
    ) a on true
   /* AS THE TICK LEFT IT, on both sides: the posts that existed then, and the
      reactions that had happened by then. That is what makes the list stand
      still. Counting reactions as they stand would move the order inside a
      slot; letting posts in as they are written would move the tail of it.
      「時間もお題のページに合わせるってこと」 OWNER -- and the day's sentence
      is one row that does not move until the next one is written.

      It costs what standing still costs, and the cost is real: a post written
      a minute ago is not in this list and cannot be until the tick comes
      round. That is the shape that was asked for. */
   where v.created_at >  feed_slot() - interval '48 hours'
     and v.created_at <= feed_slot()
     and v.hidden_at is null
   order by ((k.pts + a.pts) * feed_weight(v.author)) desc, v.created_at desc
   limit lim offset off
$$;
grant execute on function feed_hot(int, int) to anon, authenticated;

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
-- How many of everything there is
--
-- Four numbers on one screen: people, posts, languages, reports. Every one of
-- them is a count of a table that already exists, and none of them is a new
-- thing kept anywhere -- asking is the whole of it, and the answer is not
-- written down. Nothing about a person is in here and nothing can be: what
-- comes back is four integers with no rows behind them.
--
-- It is a function and not four requests for two reasons, and the second is
-- the one that matters.
--
-- The first is that four requests are four requests. PostgREST answers a
-- count in a Content-Range HEADER, and www/net.js reads bodies.
--
-- The second: counting the languages through the table would mean widening
-- `language_read`, which today is "published, or yours". Adding is_staff() to
-- it would hand staff the CONTENTS of every language nobody has published --
-- somebody's four months of work, unfinished, read by an account that only
-- wanted to know how many there were. rls-check.mjs has a claim named "what a
-- language is made of is nobody else's" and that claim is the reason. So the
-- count is taken by a function with definer rights, which sees every row and
-- hands back a number, and the read policy does not move.
--
-- `security definer` for the same reason post_hide() is, and the question is
-- asked inside for the same reason: the definer rights are not a way in.
--
-- is_admin() and not is_staff(): 「＠linguaのアカウントだけ管理者ページには
-- 入れる」. Staff answer reports, on the reports screen, through report_read.
-- This is the other screen.
create or replace function admin_counts()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare n jsonb;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  select jsonb_build_object(
    'people',  (select count(*) from profile),
    'posts',   (select count(*) from post),
    'langs',   (select count(*) from language),
    'reports', (select count(*) from report)
  ) into n;
  return n;
end $$;
revoke all on function admin_counts() from public;
grant execute on function admin_counts() to authenticated;

-- ---------------------------------------------------------------------------
-- The first one, and everybody after
--
-- 「そしたら@でいいよ。linguaで登録してる」. The account holding the handle
-- `lingua` is the one above staff. It is written here rather than set by hand
-- in the dashboard, because a step a person has to remember is a step that
-- gets forgotten once -- and the thing forgotten is the only account that can
-- let anybody else in.
--
-- Both halves, because the row may arrive either side of this file being run:
-- the trigger catches a profile made later (it is made when somebody signs in
-- on a phone -- supabase/setup.md §5), and the statement under it catches the
-- row that is already there. Neither cares which order they happen in, and on
-- an empty database the statement touches nothing and does not fail, which is
-- what lets tools/rls-check.mjs apply this file unchanged.
--
-- What this does NOT defend against, said out loud: on a database where nobody
-- holds `lingua` yet, whoever takes the handle first becomes the one above
-- staff. `handle` is unique, so the window shuts the moment that row exists --
-- and on the live database it already does. On a new one, sign in first.
create or replace function profile_first() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.handle = 'lingua' then
    new.staff := true;
    new.admin := true;
  end if;
  return new;
end $$;
drop trigger if exists profile_first on profile;
create trigger profile_first before insert on profile
  for each row execute function profile_first();

update profile set staff = true, admin = true where handle = 'lingua';

-- ---------------------------------------------------------------------------
-- Making somebody staff, and unmaking them
--
-- 「staffアカウントはスタッフページから追加できるようにしよう」, by handle,
-- because a handle is the only name this app has for a person: `profile` holds
-- id, handle, display, created_at and the flags, and an address lives in
-- auth.users, which is Supabase's and is not read from here.
--
-- Functions and not a policy, for the reason post_hide() is not an update
-- policy. `for update using (is_admin())` would say "the one above staff may
-- edit these rows" -- every column of them, including somebody's handle and
-- the name they chose. These two reach one column and nothing else.
create or replace function staff_add(h text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update profile set staff = true where handle = h;
end $$;
revoke all on function staff_add(text) from public;
grant execute on function staff_add(text) to authenticated;

-- `and not admin` is the whole of "the one above staff cannot be taken off
-- it". It is the one failure here that cannot be undone from inside the app:
-- an owner who is no longer the owner has no screen left to fix it from.
-- account_ban() carries the same guard for the same reason, and it costs
-- three words.
create or replace function staff_drop(h text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update profile set staff = false where handle = h and not admin;
end $$;
revoke all on function staff_drop(text) from public;
grant execute on function staff_drop(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Everybody who starts now starts out following @lingua
--
-- 「他の人が始めたらlinguaアカウントは強制的にフォローしてる状態にしたい」,
-- and, asked which of the two shapes it should be: 「A: 初期状態として
-- フォロー済み。外せる」.
--
-- So it is one row, put in at the moment the profile is made, and an ordinary
-- follow from then on: `follow_drop` is not touched and the person takes it
-- off exactly the way they take any other one off. A follow that could not be
-- removed would be a different thing wearing the same word.
--
-- Here and not in the app, because www/ is a suggestion: somebody running a
-- changed copy of it would simply not do it. This is the one place that
-- cannot be edited from a phone.
--
-- It is an AFTER trigger on INSERT only, so it reaches nobody who is already
-- here. That is the decision as given -- 「他の人が始めたら」 -- and not a
-- shortcut: writing the row onto accounts that already exist would be putting
-- something in somebody's list months after they made it.
--
-- `follower <> followed` is a check constraint, so @lingua's own row is
-- stepped around rather than inserted and rolled back. And on a database
-- where nobody holds the handle yet there is nobody to follow, which is not
-- an error -- it is the morning before the owner has signed in.
create or replace function profile_follows() returns trigger
language plpgsql security definer set search_path = public as $$
declare l uuid;
begin
  select id into l from profile where handle = 'lingua';
  if l is not null and l <> new.id then
    insert into follow(follower, followed) values (new.id, l)
      on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists profile_follows on profile;
create trigger profile_follows after insert on profile
  for each row execute function profile_follows();

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

-- And the same sentence about INSERT, which is not the same statement.
--
-- The paragraph above says "each is one UPDATE with one extra field in it",
-- and that was the whole of it for as long as the row already existed when
-- somebody reached for it. A profile does not: `profile_make` is how an
-- account writes ITSELF into existence, so the first write of the row is an
-- INSERT the account controls, and `insert into profile(id,handle,admin)
-- values (me,'x',true)` was one extra field in exactly the same way. Column
-- privileges for INSERT are a separate grant from the ones for UPDATE, so
-- revoking UPDATE said nothing about it: `is_admin()` reads `profile.admin`,
-- and anybody who had not made their profile yet could arrive holding it,
-- which opens admin_counts(), staff_add(), staff_drop(), post_hide(),
-- account_ban() and the report queue behind them.
--
-- The four named are what netMakeProfile() in www/net.js sends. staff, admin,
-- banned_at and banned_why are the server's, and the only thing that writes
-- them is profile_first() -- a BEFORE trigger, which assigns to NEW rather
-- than naming a column in the statement, so it is not what this grant is
-- about and @lingua still arrives holding both flags.
revoke insert on profile from anon, authenticated;
grant  insert (id, handle, display, av) on profile to anon, authenticated;

-- ---------------------------------------------------------------------------
-- And the question that is no longer asked
--
-- has_account() -- "there is an account, anonymous counts" -- is dropped by
-- name rather than merely deleted from this file. This file gets pasted over a
-- database that already has one, so a function nobody writes down any more
-- goes on existing there, and a function that exists is one a policy written
-- next year can reach for without anybody noticing what it means.
--
-- Here, at the foot, and not where it used to be defined: every policy above
-- had to stop naming it first. A `drop` with no `cascade` refuses rather than
-- quietly taking a policy down with it, so if this line ever errors it is
-- telling the truth -- something is still standing on it.
drop function if exists has_account();
revoke update on post from anon, authenticated;
grant  update (body, language, prompt, reply_to) on post to anon, authenticated;

-- And INSERT, for the same reason as profile above. The comment over
-- hidden_at says "nobody may set these but the two functions at the foot of
-- this file", and revoking UPDATE held that for every post that already
-- existed. A post does not exist until its author writes it, and that write
-- is theirs: `insert into post(author,body,hidden_at,hidden_why) values
-- (me,'{}',now(),'x')` put up a post that reads as taken down by staff, with
-- a reason its own author wrote, and post_show() is staff's -- so it could
-- not be undone by the person who did it either.
--
-- The five named are what netSend('POST','/rest/v1/post') sends in www/net.js
-- (id, author, body, prompt, reply_to) plus `language`, which the update line
-- above already calls the author's. created_at is left out on purpose: it
-- defaults to now() and a client that could name it could date a post.
revoke insert on post from anon, authenticated;
grant  insert (id, author, language, body, prompt, reply_to) on post to anon, authenticated;
