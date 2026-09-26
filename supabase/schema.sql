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

-- The line somebody writes about themselves, and it is SHOWN.
--
-- 「自己紹介を見せないって選択肢を俺はいつ与えた？」 OWNER 2026-09-01. There
-- is no switch here and there is not going to be one: a profile is what other
-- people see, and this is part of it. `profile_read` is `using (true)` and
-- that is the whole of the reading rule -- the same sentence the handle, the
-- display name and the face are already under.
--
-- It existed on the phone and only there. `ME.bio` in www/me.js was written,
-- kept and drawn, and netMakeProfile() sent `handle`, `display` and `av` and
-- nothing else -- so a line somebody wrote about themselves was invisible to
-- every other person and was gone the day the phone was. 「そもそも端末に保存
-- するもんはないぞほとんど」 OWNER 2026-09-01: the server is the record and
-- the phone is the copy.
--
-- 160 IS `ME_MAX.bio` IN www/me.js AND THE TWO MUST MOVE TOGETHER. SQL cannot
-- read that file, so this is the one place in this repository where a number
-- is written twice on purpose; it is here rather than absent because a text
-- column with no ceiling is a column somebody puts a megabyte in, and the
-- phone's `maxlength` is a suggestion the way the whole app is a suggestion.
alter table profile add column if not exists bio text
  check (bio is null or length(bio) <= 160);

-- Where somebody is, and their address on the rest of the internet. Both are
-- FREE TEXT and neither has a format.
-- 「自由入力です。」「だって自分の国入れたい人だっているやん」
-- OWNER DECISION 2026-08-25 -- not the phone's position, not a country code,
-- no list to pick from, and no check on the shape of the link. A check
-- constraint on the form of either would be this file overturning that
-- decision, so what is here is a ceiling on the length and nothing else.
--
-- They existed on the phone and only there, exactly as `bio` did before it was
-- added above: www/me.js wrote `ME.link` and `ME.loc`, kept them and never
-- sent them, so what somebody typed was invisible to every other person and
-- was gone the day the phone was. 「そもそも端末に保存するもんはないぞほとんど」
-- OWNER 2026-09-01.
--
-- 100 AND 30 ARE `ME_MAX.link` AND `ME_MAX.loc` IN www/me.js AND THE THREE
-- NUMBERS MUST MOVE TOGETHER. Same sentence `bio`'s 160 is under, for the same
-- reason: SQL cannot read that file, and a text column with no ceiling is one
-- somebody puts a megabyte in.
alter table profile add column if not exists link text
  check (link is null or length(link) <= 100);
alter table profile add column if not exists loc text
  check (loc is null or length(loc) <= 30);

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
--
-- NOTHING READS THIS COLUMN ANY MORE, and nothing writes it. The one above
-- staff is the HANDLE -- 「@で決めたんじゃないの？」 OWNER 2026-09-03, and
-- is_admin() below is where that is said. It is not dropped: somebody's row
-- holds it, and this file does not delete data (docs/DATA_SAFETY.md). The
-- line stays so that a database that has never had the column still matches
-- one that has.
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

-- When the @ last moved, and nothing else on this row is about time.
-- 「ユーザーネームは14日に1度しか変更できないようにしたい」 OWNER 2026-09-03.
-- What holds the fourteen days is profile_rename(), a thousand lines down,
-- beside the other thing that may not be done to a handle.
--
-- NULL IS NOT "LONG AGO", IT IS "NEVER", and the difference is the whole of
-- what this column had to be careful about. Choosing the @ when the account is
-- made is not a change -- there was nothing there to change -- so somebody who
-- signed up this morning is not held for a fortnight away from the first name
-- they picked before they had seen it written anywhere. The trigger reads null
-- as "go ahead", and the first rename is what writes this.
--
-- Not in either grant at the foot of this file, and that is the whole of why
-- fourteen days mean anything. An account that could write when it last
-- renamed itself could write that it was a month ago, and the rule would hold
-- against nobody who did not want it to. Only the trigger writes it -- it
-- assigns to NEW rather than naming a column in a statement, which is the same
-- road profile_first() takes to `staff`, said again at the grants.
--
-- Not on profile_seen either. When somebody last changed their name is not
-- something other people are shown; the view beside it is what everybody may
-- read, and this is not on it.
alter table profile add column if not exists handle_at timestamptz;

-- ---- HOW THIS ACCOUNT HAS THE APP SET UP ------------------------------
-- 「端末ごとにやることなんてねえよ」「アカウントごとってずっと言ってるよな？」
-- OWNER 2026-09-03, and 「端末に残すものないんですけど。サーバーで同じ機能に
-- なるように代替して」 OWNER 2026-09-08.
--
-- The theme, the interface language, whether the drawn font is used on screen,
-- whether the drawn letters are shown rather than the roman ones, and whether
-- the keyboard shows its roman face. Every one of them was a field of
-- `lingua.set` on the handset and named in SET_PHONE as 「how this handset is
-- set up」 -- so signing in on a second phone gave somebody the app arranged
-- the way that phone happened to be, not the way they arrange it.
--
-- ONE COLUMN AND NOT FIVE. What SET holds is www/core.js's to say (SET_PREFS),
-- and five columns here would be that list written down a second time, in
-- another language, for a server that never looks inside. Adding a sixth
-- setting is a name on that list and nothing here.
--
-- jsonb and not text: it is an object either way, and jsonb is what the rest
-- of this file already uses for `av`. The server does not read it.
--
-- IT IS NOT IN `profile_seen`. This is how somebody has their own app set up
-- and is nobody else's business -- the view is what other people may read.
alter table profile add column if not exists prefs jsonb not null default '{}'::jsonb;

-- WHEN EACH THING ON THIS ROW WAS LAST CHANGED BY A PERSON, as the phone they
-- changed it on tells it: field -> milliseconds. keep_newer() below is what
-- reads it. Said here because prefs_put() writes it; `slice` and `draft` get
-- the same column where they are made.
alter table profile add column if not exists ed jsonb not null default '{}'::jsonb;

-- AND ONE SETTING AT A TIME. A PATCH of `prefs` replaces the whole object, so
-- a phone that changed the theme sent every setting it was holding -- and the
-- one it was holding stale (a notification switched off on the other phone)
-- went back on (r63-audit SQ1, measured). This lays what was sent OVER what is
-- there: the keys sent change, every other key stays exactly as it is.
--
-- AS THE CALLER, so the row policy and the column grant below are what decide
-- whose row it touches -- `id = auth.uid()` is the caller's own and nobody
-- else's, and a caller with no session updates nothing.
--
-- AND EACH KEY CARRIES WHEN IT WAS PRESSED (`e`, key -> milliseconds), which
-- goes into `profile.ed` as `prefs.<key>` -- keep_newer() below keeps a key
-- whose press is older than the one already here. What is handed back is the
-- settings as they now stand, so the phone that lost takes the other one's.
drop function if exists prefs_put(jsonb);
create or replace function prefs_put(p jsonb, e jsonb default '{}'::jsonb) returns jsonb
  language sql security invoker set search_path = public as $$
  update profile set prefs = coalesce(prefs, '{}'::jsonb) || coalesce(p, '{}'::jsonb),
                     ed = coalesce(ed, '{}'::jsonb) ||
                          coalesce((select jsonb_object_agg('prefs.' || k, v)
                                      from jsonb_each(coalesce(e, '{}'::jsonb)) as x(k, v)),
                                   '{}'::jsonb)
   where id = auth.uid()
  returning prefs;
$$;

-- ---- what ------------------------------------------------------------------
-- A language. Published or not; a language nobody published is its owner's
-- and nobody else's. This row and the slices under it are where a language
-- lives -- the phone holds a copy to look at (CLAUDE.md rule 22).
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
  -- The ACCOUNT, not its page: auth.users and not profile. It was made
  -- that way when a language was minted at first launch by an anonymous
  -- account, which had no profile row. There are no anonymous accounts now
  -- (「匿名アカウントはねえよ」, is_member() below) -- the reference stays on
  -- auth.users because moving a foreign key under every row is a migration
  -- nobody has asked for, and it answers the same question either way.
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
-- ---- AND HOW THE LANGUAGE IS WRITTEN ----------------------------------
-- 「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
-- OWNER 2026-09-08.
--
-- This was `SET.wsys` -- a field of the PERSON's settings, on the handset,
-- named in SET_PHONE. tools/store-check.mjs wrote GAP against it in its own
-- words: 「言語のものなのに人の設定に入っているので、公開した言語は書記体系を
-- 見せられない」. It is the language's, so it is a column on the language:
-- somebody with two languages had one answer for both, and a published
-- language could not say whether it was written as an alphabet, a syllabary,
-- an abugida or a logography.
--
-- Empty is not a fifth kind. It means nobody has SAID, and www/wsys.js
-- answers for that by looking at the language (wsGuess) -- the same sentence
-- `published_at`'s absence carries: a state, not a value.
--
-- No check constraint. What the five kinds are is www/wsys.js's list (WSYS),
-- and a constraint here would be that list written down a second time, in
-- another language, for a server that never looks inside a slice either.
alter table language add column if not exists wsys text not null default '';

alter table language drop constraint if exists language_owner_fkey;
alter table language add  constraint language_owner_fkey
  foreign key (owner) references auth.users(id) on delete cascade;
create index if not exists language_owner_idx on language(owner);
create index if not exists language_published_idx on language(published_at) where published_at is not null;

-- ---- AND WHICH OF SOMEBODY ELSE'S LANGUAGES AN ACCOUNT HAS TAKEN -------
-- 「端末に残すものないんですけど。サーバーで同じ機能になるように代替して」
-- OWNER 2026-09-08.
--
-- Downloading a chapter of somebody else's language put a row in the PHONE's
-- index carrying `uid` -- and `LANGS[id].uid` on a downloaded language is not
-- `language.owner` at all: the owner is who WROTE it, and this is who TOOK
-- it. Two different facts wearing one field. `dlCount()` counts this one --
-- the ceiling on downloads is per account (「plusは1つproは3つ」 OWNER
-- 2026-09-02) -- so on a second phone the number started at nought and the
-- ceiling was one ceiling per handset.
--
-- ONE ROW PER (ACCOUNT, LANGUAGE) and nothing else on it. What was taken is
-- the `slice` rows the phone already holds; this says only that this account
-- took this language, which is what a ceiling counts and what a list of
-- 「languages I am reading」 is drawn from.
--
-- BOTH SIDES CASCADE. The account going takes its rows (nobody is counting
-- for a person who is not there); the LANGUAGE going takes them too, because
-- a row naming a language that no longer exists counts towards a ceiling for
-- something nobody can open.
--
-- IT IS NOT A COPY OF THE LANGUAGE. Reading what was taken is `slice_read`
-- and `slice_dl()` below, unchanged: this row opens no door that was shut.
create table if not exists language_take (
  uid       uuid not null references auth.users(id) on delete cascade,
  language  uuid not null references language(id)   on delete cascade,
  at        timestamptz not null default now(),
  primary key (uid, language)
);
create index if not exists language_take_uid_idx on language_take(uid);

-- AND IT IS THE ONE THING AN UNPUBLISHED LANGUAGE IS STILL READ THROUGH.
-- 「非公開にしたら新規 dl だけできないだけ」 OWNER 2026-09-09
-- (docs/FEATURE_RULES.md § DL 言語の四つ).
--
-- `slice_read` was 「the owner, or published」, so the moment somebody took a
-- language away from the page the people who had already taken it opened it on
-- the next launch to nothing at all -- the row would not come down either, so
-- not even its name. That is not what unpublishing was decided to be: it stops
-- a NEW download and nothing else. Somebody who took a chapter keeps reading
-- the chapter they took.
--
-- WHAT IT DOES NOT DO IS WIDEN WHAT THEY MAY READ. It stands in for the
-- published test and for nothing else, so the dictionary and the grammar still
-- ask the owner's own switch (`slice_dl`) beside it: a language whose words
-- were never offered does not start offering them by going private.
--
-- `security definer`, and it answers about auth.uid() and about nothing
-- else, so the most it can tell anybody is what they themselves took; with
-- nobody signed in auth.uid() is null and it is false.
create or replace function language_took(lang uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from language_take t
                  where t.uid = auth.uid() and t.language = lang) $$;

-- ---- what a language is made of ---------------------------------------
-- One row per slice, and `SLICES` in www/core.js is the list of them -- read
-- it there rather than a count here, which said eleven while there were
-- twelve. They are SLICES here for the same reason they are slices in
-- www/core.js: one row per slice and not one row per language.
--
-- The reason is what happens with two phones. One number for a whole language
-- means adding a word on one phone and drawing a letter on the other is a
-- collision, and one of the two has to lose something nobody was arguing
-- about. Per slice they do not touch each other at all.
--
-- Inside one slice the phone merges rather than overwriting -- a word added
-- here and a word added there are both added -- so what is stored is the
-- result and not a claim about who was first. What says the phone merged
-- against what is here is `ed.was` (keep_newer() below), not `no`.
--
-- `no` IS HOW MANY TIMES THE SERVER HAS TAKEN THIS SLICE, and the server is
-- the one that counts. 「番号はサーバーが配ります」 (docs/FEATURE_RULES.md,
-- 2026-09-04): slice_no() below sets it on every write, 1 for the first and
-- one more than the row held after that, and whatever number the phone sends
-- is not read. www/net.js still sends `no + 1`; it is thrown away here.
--
-- `body` is text and not jsonb on purpose: it is exactly the string the
-- phone holds, so there is one shape for a slice and not two that could
-- disagree. The server never looks inside it.
create table if not exists slice (
  language   uuid not null references language(id) on delete cascade,
  kind       text not null,
  body       text not null default '',
  no         bigint not null default 1,
  at         timestamptz not null default now(),
  primary key (language, kind)
);
create index if not exists slice_language_idx on slice(language);
alter table slice add column if not exists ed jsonb not null default '{}'::jsonb;

create or replace function slice_no() returns trigger
language plpgsql as $$
begin
  new.no := case when tg_op = 'UPDATE' then old.no + 1 else 1 end;
  return new;
end $$;
drop trigger if exists slice_no on slice;
create trigger slice_no before insert or update on slice
  for each row execute function slice_no();

-- ---- slice_hist ---------------------------------------------------------
-- The three versions before now, so that somebody who writes in and says
-- 「単語が全部消えた」 has something to be given back.
--
-- 「運営が治せる仕様は欲しい。ユーザーが問い合わせてきた時に、アカウントの
-- 復旧ができるようにしたい、管理画面で」「3 で実装して」 OWNER 2026-09-09.
--
-- THE NUMBER IS A COUNT AND NOT A LENGTH OF TIME. Three versions per part per
-- language, and the fourth push drops the oldest. A period was the other way
-- of writing this and was not chosen: a person who saves ten times in an hour
-- and writes in the next day is the case this exists for, and a week of
-- retention answers them with a week of nothing while a 5000-word language
-- costs 685 KB a version (docs/RECOVERY.md 案A の実測).
--
-- IT IS THE OPERATOR'S AND NOT THE AUTHOR'S. Only is_staff() may read it,
-- there is no insert, update or delete policy on it at all, and no screen in
-- the app shows a person their own versions -- a date beside every version is
-- a record of when somebody changed their mind (docs/STATE.md § 4a 四).
--
-- `body` is text for the same reason slice.body is: it is exactly the string
-- the phone holds, and the server never looks inside it.
create table if not exists slice_hist (
  language   uuid not null references language(id) on delete cascade,
  kind       text not null,
  body       text not null,
  at         timestamptz not null,
  primary key (language, kind, at)
);
create index if not exists slice_hist_at_idx on slice_hist(language, kind, at desc);

-- WHICH SAVE A VERSION BELONGS TO. 「言語を前に戻す →『3つ前、まるごと』」
-- OWNER 2026-09-24: a version is the WHOLE LANGUAGE as it was before one save,
-- and one save is several rows of `slice` (the kinds that moved), written by
-- separate requests. So the phone numbers each save (`press`, one uuid per
-- netSaveNow() in www/net.js) and puts it on every row that save writes; the
-- trigger below writes onto the version it keeps the number of the save that
-- REPLACED it. A row written before this carries none and is a version of its
-- own, named by its time -- nothing old is dropped or renumbered.
alter table slice add column if not exists press uuid;
alter table slice_hist add column if not exists press uuid;

-- THE ONLY AUTOMATIC DELETION IN THIS FILE, and its DELETE REVIEW is in
-- docs/CHANGELOG.md 2026-09-09. What it removes is a copy of a previous
-- version; the row somebody is actually holding (`slice`) is never touched by
-- this trigger, which only ever reads OLD.
--
-- BEFORE UPDATE AND BEFORE DELETE, so the version kept is the one that is
-- about to stop existing. The app is a line lighter for it: netSlicePut() in
-- www/net.js is unchanged and knows nothing about any of this.
--
-- `security definer`, because slice_hist has no write policy of any kind --
-- the trigger is the one road in, and a policy would be a second one.
--
-- A LANGUAGE GOING TAKES ITS VERSIONS AND KEEPS NONE. When `language` is
-- deleted the cascade reaches `slice`, this fires, and writing a version of a
-- language that is on its way out would be both an FK the same statement is
-- removing and a copy of somebody's work outliving their decision to delete
-- it. So the row is checked for: gone means nothing is kept.
--
-- `at` IS WHEN THAT BODY STOPPED BEING THE CURRENT ONE, and not when it was
-- written. It was the slice's own `at` first and that was wrong twice over:
-- the ceiling below keeps the three NEWEST, so a column that does not move
-- when the body does puts the versions in an order that is not the order they
-- happened in -- and a plain `update slice set body=...` never touches it, so
-- four versions all carried the moment the row was first inserted. Measured
-- 2026-09-09 (npm run rls): restoring a version wrote the undo in at the
-- OLDEST timestamp and the ceiling dropped it in the same statement, so the
-- one thing this table promises -- 戻すのを戻せる -- was gone a microsecond
-- after it was made. clock_timestamp() and not now(): now() is one instant
-- for a whole transaction, and two saves in one transaction would collide.
-- The nudge below is what is left of that collision, kept because dropping a
-- version to satisfy a primary key is losing the thing this table is.
create or replace function slice_hist_keep() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_at timestamptz;
begin
  if tg_op = 'DELETE'
     and not exists (select 1 from language where id = old.language)
  then return old; end if;

  v_at := clock_timestamp();
  while exists (select 1 from slice_hist
                 where language = old.language and kind = old.kind and at = v_at)
  loop v_at := v_at + interval '1 microsecond'; end loop;

  -- The save that replaced it, when there was one. A write that did not
  -- carry a number leaves the row's old one standing, and that is not the
  -- save that replaced it -- so it is taken only where it moved.
  insert into slice_hist(language, kind, body, at, press)
       values (old.language, old.kind, old.body, v_at,
               case when tg_op = 'UPDATE' and new.press is distinct from old.press
                    then new.press end);

  delete from slice_hist h
   where h.language = old.language and h.kind = old.kind
     and h.at not in (select at from slice_hist
                       where language = old.language and kind = old.kind
                       order by at desc limit 3);
  /* NEW ON AN UPDATE AND OLD ON A DELETE, AND THE TWO ARE NOT INTERCHANGEABLE.
     A BEFORE UPDATE trigger returning OLD is the row saying 「write this
     instead」 -- so it does not refuse the update, it silently writes the row
     back exactly as it was. Nothing throws, the statement reports one row
     updated, and every save anybody made would have been quietly discarded
     while the history filled with three copies of the same first version.
     Measured 2026-09-09 (npm run rls): three rows, three timestamps, one
     body. */
  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger if exists slice_hist_before on slice;
create trigger slice_hist_before before update or delete on slice
  for each row execute function slice_hist_keep();

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

-- What this QUOTES. 「引用リツイート追加しない？」 OWNER 2026-09-25
-- (docs/FEATURE_RULES.md § 2026-09-25 いいね・リポストした人の一覧…). A quote
-- is a post of its own with somebody else's under it, and what is under it is
-- drawn from the server AS IT IS NOW (post_seen.quoted) -- so the post
-- carries the id and nothing of the other post's words.
--
-- NO FOREIGN KEY, and that is the reason it is a bare uuid. `on delete set
-- null` would turn a quote whose post was deleted back into an ordinary post,
-- and a reader would no longer be told 「この投稿は表示できません」 -- the one
-- thing the owner asked for about a quote that has lost its post. The id
-- stays; post_seen.quoted is null for it, as it is for one a block hides.
-- Written once, when the quote is sent: it is in the `grant insert` at the
-- foot of this file and not in the `grant update`.
alter table post add column if not exists quote_of uuid;
create index if not exists post_quote_idx on post(quote_of, created_at) where quote_of is not null;

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
alter table draft add column if not exists ed jsonb not null default '{}'::jsonb;

-- ---- THE LATER EDIT WINS ------------------------------------------------
-- 「普通後から変えたほうになる？アプリ気になるそこ」 OWNER 2026-09-04
-- (docs/FEATURE_RULES.md § 同期でぶつかったら、後から「直した」ほうが残るべき).
--
-- Two phones change the same thing. What stayed was whichever CONNECTED last,
-- because nothing on a row said when anything on it was changed -- the server
-- had nothing to compare. One sentence covers every place that can happen:
--
--   A WRITE CARRIES WHEN A PERSON MADE IT, AND THE SERVER KEEPS A THING ONLY
--   FROM A WRITE NEWER THAN THE ONE IT IS HOLDING.
--
-- `ed` on each row is that record: a field (or `prefs.<key>`, one level down
-- into a jsonb column) -> the milliseconds the phone says it was changed at.
-- On an update, every field the write carries a time for is compared, and a
-- field whose time is OLDER keeps what is here; its time stays the newer one.
-- A field the write carries no time for is not compared -- an older version
-- of the app writes none, and there is nothing to compare it with.
--
-- ONE MORE THING FOR A SLICE, and it is the same sentence one step earlier.
-- A slice is a list that two phones ADD to, and the phone puts the two
-- together before it writes (www/sync.js) -- which only works if what it put
-- together is what is here. `ed.was` is the time it merged against; if this
-- row has moved since, the write is refused with `stale` and the phone reads
-- again and merges again (r63-audit 0-4: `no` was a counter nobody compared).
-- A refusal and not a quiet keep, because a slice is written without asking for
-- the row back (www/net.js § netSend) and a quiet keep would say nothing.
--
-- The time is the phone's clock. A phone whose clock is far out wins or loses
-- by that much; nothing here can know better.
create or replace function keep_newer() returns trigger
language plpgsql as $$
declare
  o  jsonb := '{}'::jsonb;
  n  jsonb := to_jsonb(new);
  ed jsonb := '{}'::jsonb;
  k  text; col text; sub text; ne numeric; oe numeric;
begin
  -- A first write has nothing here to be newer than; it is asked the same
  -- questions against an empty row, so `was` is held to 「nothing」 too.
  if tg_op = 'UPDATE' then
    o  := to_jsonb(old);
    ed := coalesce(o -> 'ed', '{}'::jsonb);
  end if;
  if (n -> 'ed') ? 'was' then
    if coalesce(nullif(ed ->> 'body', '')::numeric, 0)
       <> coalesce(nullif(n -> 'ed' ->> 'was', '')::numeric, 0) then
      raise exception 'stale' using errcode = 'P0001';
    end if;
    n := jsonb_set(n, '{ed}', (n -> 'ed') - 'was');
  end if;
  for k in select jsonb_object_keys(coalesce(n -> 'ed', '{}'::jsonb)) loop
    ne  := nullif(n -> 'ed' ->> k, '')::numeric;
    oe  := nullif(ed ->> k, '')::numeric;
    col := split_part(k, '.', 1);
    sub := nullif(split_part(k, '.', 2), '');
    if oe is not null and (ne is null or ne < oe) then
      if sub is null then
        n := jsonb_set(n, array[col], coalesce(o -> col, 'null'::jsonb));
      elsif (o -> col) ? sub then
        n := jsonb_set(n, array[col, sub], o -> col -> sub);
      else
        n := jsonb_set(n, array[col], coalesce(n -> col, '{}'::jsonb) - sub);
      end if;
    elsif ne is not null then
      ed := jsonb_set(ed, array[k], to_jsonb(ne));
    end if;
  end loop;
  n := jsonb_set(n, '{ed}', ed);
  new := jsonb_populate_record(new, n);
  return new;
end
$$;
-- First of every trigger on the row (they run in name order), so what the
-- others see -- slice_hist keeping the version before, profile_rename's
-- fourteen days -- is the write as it will land.
drop trigger if exists a_keep_newer on slice;
create trigger a_keep_newer before insert or update on slice
  for each row execute function keep_newer();
drop trigger if exists a_keep_newer on draft;
create trigger a_keep_newer before insert or update on draft
  for each row execute function keep_newer();
drop trigger if exists a_keep_newer on profile;
create trigger a_keep_newer before insert or update on profile
  for each row execute function keep_newer();

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

-- WHAT SOMEBODY TYPED, as against what they starred.
--
-- 「検索した履歴もユーザーはいらんから5個くらい検索履歴出るようにしたい」
-- 「1件づつ消せるでいいよ」 OWNER 2026-09-03.
--
-- A TABLE OF ITS OWN AND NOT A COLUMN ON `saved_search`, and the reason is
-- that they are two different things a person did. A star is a word somebody
-- CHOSE to keep; a recent is a word they merely TYPED. Marking one row
-- 「this is a star, this is a history」 makes them one mechanism, and the
-- first thing that breaks is un-starring a word taking the history with it --
-- or the history's own five-item ceiling quietly deleting somebody's star.
-- They are never the same row.
--
-- `unique (author, q)` so typing the same words again is the SAME search
-- rather than a second line of it. What moves is `at`, which is why that
-- column is `at` and not `created_at`: it is when this was last searched
-- for, and it is what the list is ordered by.
--
-- Five is the whole of what this feature IS -- 「直近5件」 -- so the sixth
-- pushing the oldest off is the decision rather than a cleanup invented here.
-- The PHONE drops the one that fell off, by its words, the way it drops a
-- star. Nothing in this file deletes on its own and there is no trigger.
create table if not exists recent_search (
  id     uuid primary key default gen_random_uuid(),
  author uuid not null references profile(id) on delete cascade,
  q      text not null check (q <> '' and length(q) <= 200),
  at     timestamptz not null default now(),
  unique (author, q)
);
create index if not exists recent_search_author_idx
  on recent_search(author, at desc);

-- WHAT THIS ACCOUNT HAS PAID FOR.
--
-- 「課金とアカウントとキーボードはアカウントに結びつく。
--   じゃないとアカウント変えたら無限に言語作れるやん」 OWNER 2026-09-01.
--
-- The plan lived in `lingua.set` on the phone -- the person's SETTINGS, which
-- belong to the device and to no account. So it did not travel: signing in on
-- a second phone arrived on the free plan, and every ceiling the plan opens
-- was counted per device rather than per account.
--
-- A TABLE OF ITS OWN AND NOT A COLUMN ON `profile`, and the reason is one
-- line further up this file: `profile_read` is `using (true)`. Everybody can
-- read every profile, because that is what a profile IS -- a handle and a
-- display name that other people see. **What somebody pays is not that.**
-- A `plan` column there would have published every person's tier to every
-- reader of the timeline, and nothing would have thrown.
--
-- It references auth.users rather than profile(id): an account has a plan
-- from the moment it exists, and picking a handle is a later step it must not
-- depend on.
--
-- NOBODY WRITES THIS ROW BUT THE SERVER, and that is 2026-09-06.
-- 「だから端末でやるわけねえだろ」 OWNER 2026-09-03.
--
-- It used to be written by the PHONE, and the phone is the person: anybody who
-- could send this database a request could set their own plan to 'pro'. That
-- is closed. `verify-plan` (supabase/functions/verify-plan) is the only thing
-- that writes here -- it reads Apple's signature off the transaction itself,
-- binds it to the account that bought it, and writes the answer with the
-- service role, which no policy applies to. There is no insert policy and no
-- update policy below, so through the API this table is READ ONLY, to its
-- owner, and to nobody else.
--
-- `at` is when it last moved, and it is a record rather than a clock anything
-- reasons with -- the same argument bkNo() makes in docs/DATA_SAFETY.md.
create table if not exists plan (
  id    uuid primary key references auth.users on delete cascade,
  plan  text not null default 'free' check (plan in ('free', 'plus', 'pro')),
  at    timestamptz not null default now()
);

-- WHAT IT WAS BEFORE, AND WHETHER THEY HAVE BEEN TOLD.
--
-- 「オンラインで出してね流石に」「4 起動の時に表示して ☑️今後表示しない 閉じる
--   みたいなポップにしたくない？」 OWNER 2026-09-12.
--
-- 「プランが終了しました」 used to be decided on the PHONE: capLapse() compared
-- the plan with `SET.planWas`, the word this handset last showed, and on a
-- phone whose Keychain read failed that told somebody who had never subscribed
-- that their subscription had ended. The word went on 2026-09-11 (rule 22) and
-- the sentence went with it, because this table was `(id, plan, at)` and could
-- not answer 「what was it before」 either.
--
-- These two are that answer, and they are here rather than on a history table
-- because what the app needs is one fact and not a record: 「the段 that ended」.
--
--   was            the rung this account held until the answer that lowered
--                  it. Written ONLY when the plan goes DOWN, set back to null
--                  when it goes up, and left as it is when it stays --
--                  「終了」 is a fact about coming down, so a null here is
--                  「nothing ended」 rather than 「nobody has looked」.
--   lapse_seen_at  when they said 「今後表示しない」. Null while they have not,
--                  and null again the moment `was` is written, because a
--                  SECOND ending is a second thing to be told about.
--
-- The phone keeps NO mark of either. That is the whole reason they are here:
-- a 「見せる／見せない」 decision made out of a word on a handset is the shape
-- 2026-09-11 deleted, and putting it back under another name would be the same
-- bug with a different spelling.
alter table plan add column if not exists was text
  check (was is null or was in ('free', 'plus', 'pro'));
alter table plan add column if not exists lapse_seen_at timestamptz;

-- WHICH ACCOUNT A PURCHASE BELONGS TO.
--
-- 「アカウントごとなんだから、違うアカウントで復元できるのおかしいだろ。
--   検証して」 OWNER 2026-09-06.
--
-- One row per subscription, keyed on Apple's `originalTransactionId` -- the id
-- that stays the same across every renewal of one subscription, which is what
-- makes a renewal an update of this row rather than a second row claiming the
-- same money.
--
-- IT IS THE BINDING AND NOT A RECEIPT STORE. What it answers is one question:
-- **whose is this?** A purchase made while signed in as A carries A's uid in
-- `appAccountToken`, signed by Apple, and the function refuses it for anybody
-- else -- so signing in as B and pressing Restore gives B nothing. A purchase
-- made BEFORE `appAccountToken` was sent carries nobody, and throwing those
-- away would take from people what they paid for; they are bound to the first
-- uid that verifies them, and refused to every other uid after that.
--
-- `until` and `revoked` are Apple's dates off the signed transaction, and the
-- plan is worked out from THESE ROWS rather than from whatever a phone sent in
-- the last call -- supabase/functions/verify-plan/index.ts says why at length.
-- A row whose `until` has passed simply stops counting, so a lapse is the same
-- one road as a purchase.
--
-- `env` is Sandbox or Production. It is written down rather than acted on: a
-- sandbox receipt on a TestFlight build is a real purchase to that tester, and
-- the day the two need telling apart, the answer is on the row rather than
-- worked out again.
--
-- Written ONLY by the service role, like `plan`. There is no insert or update
-- policy below.
create table if not exists purchase (
  orig_tx text primary key,
  uid     uuid not null references auth.users on delete cascade,
  product text not null default '',
  until   timestamptz,
  revoked timestamptz,
  env     text not null default '',
  at      timestamptz not null default now()
);
create index if not exists purchase_uid on purchase(uid);

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
-- The ROW is nobody's business but yours. `block_read` below answers with
-- YOUR rows only -- the list of whom somebody blocked is not something the
-- person on it is handed. What a block DOES goes both ways (block_hides).
create table if not exists block (
  actor      uuid not null references profile(id) on delete cascade,
  blocked    uuid not null references profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor, blocked),
  check (actor <> blocked)
);
create index if not exists block_actor_idx on block(actor);

-- AND THE ONE PLACE A BLOCK IS ANSWERED. 「Blocked means you see nothing of
-- them」 OWNER 2026-08-19 (docs/FEATURE_RULES.md § Blocking) -- 「the feed
-- (left out by the server)」, and the server did not: post_seen, feed_hot,
-- feed_fo and notices() handed every row over and the phone threw some away.
--
-- Every read the app makes (a view, or a function that returns rows) asks
-- this of each person it hands out -- the author of a post, whoever passed
-- it on, whoever a notice is about -- and nothing else says what a block
-- hides. tools/rls-check.mjs walks the catalogue as somebody who has blocked
-- somebody and counts every read, so a view added tomorrow is asked tomorrow;
-- the reads a block does not reach yet are named there (BLOCK_HELD) with
-- the reason, and docs/scope/r80-block.md says what each is waiting on.
--
-- BOTH WAYS. 「ブロック → 見えなくして」 OWNER 2026-09-24: somebody who has
-- been blocked does not see the timeline, the page or the notices of the
-- person who blocked them either. So it asks whether there is a block
-- between the reader and `who`, whichever of the two made it.
--
-- `security definer`, because the other direction is a row the reader cannot
-- read (`block_read` is the blocker's alone) and must not be able to. It
-- answers one yes-or-no about auth.uid() and `who` and hands out no row.
-- A person who calls it straight can learn that somebody blocked them --
-- which is also what their page vanishing tells them; the decision is what
-- costs that, not this function.
create or replace function block_hides(who uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from block b
                  where (b.actor = auth.uid() and b.blocked = who)
                     or (b.actor = who and b.blocked = auth.uid()))
$$;

-- WHO MAY READ A LANGUAGE, AND THE ONE PLACE IT IS ANSWERED. Three roads read
-- a language -- the `language` table (`language_read`), the view the article
-- and the lists are drawn off (`language_seen`), and its slices
-- (`slice_read`) -- and each used to write the sentence out on its own. Only
-- the view asked about a block, so the table and the slices handed over the
-- published language of somebody a block stands between. 「ブロックした相手の
-- 公開言語は見えない（両向き）」 OWNER 2026-09-25. All three ask this now,
-- and tools/rls-check.mjs counts the roads (LANG_READ): a policy or a view on
-- either table that does not ask it is red.
--
-- Yours; one you TOOK, whatever it says now and whoever stands between you
-- (language_took() above -- what a block does to a taken language has not
-- been decided, docs/scope/r85-block.md, so it reads as it did); or
-- published, with no block between you and its owner either way.
--
-- `security definer`, because it is asked FROM the `language` policy and reads
-- `language`: under the reader's rights that is the policy asking itself. It
-- answers one yes-or-no about auth.uid() and one language and hands out no
-- row; with nobody signed in auth.uid() is null and only a published language
-- with nobody blocking answers yes -- and anon holds no grant to ask.
-- WHICH SLICES of a readable language come down is `slice_read`'s, not this.
create or replace function lang_readable(lang uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from language l
                  where l.id = lang
                    and (l.owner = auth.uid() or language_took(l.id)
                         or (l.published_at is not null
                             and not block_hides(l.owner))))
$$;

-- AND NOTHING IS DONE TO SOMEBODY A BLOCK STANDS BETWEEN. 「ブロックされた
-- 側 → こちらが見えないので、いいね・返信・フォローもできず、通知も来ない
-- （サーバーで止める）」 OWNER 2026-09-25. Every write that is aimed AT a
-- person asks block_hides() of that person in its policy: a follow of them
-- (follow_make), a like or a pass-on of their post (react_make), and an
-- answer to their post, written or edited into one (post_make, post_edit).
-- This is the post's half: whoever wrote post `p`. `security definer`
-- because the post may be one the writer cannot read (post_read), and it
-- hands out one yes-or-no, as block_hides() does.
--
-- It is also why supabase/functions/push-send asks nothing about a block:
-- every kind it rings for is one of those rows arriving, and a row that is
-- refused rings nobody.
create or replace function post_blocks(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from post x where x.id = p and block_hides(x.author))
$$;

-- ---- not reading somebody, without keeping them away -----------------------
-- 「人をミュートできる。ミュートした人の投稿はタイムラインに出ない（ブロック
-- とは別）」 OWNER 2026-09-25. A mute is the other shape of `block` and the
-- difference is the whole of it: it goes ONE way, and it keeps nobody out.
-- The person muted still sees you, still follows, likes and answers you, and
-- is never told; you simply stop being handed what they write in the lists
-- you scroll -- the timelines, a thread, a search.
--
-- The row is yours alone, read and written, the way `block` is: who somebody
-- has stopped reading is nobody else's business, and least of all the
-- person's on the other end of it. Deleting either account takes the row.
create table if not exists mute (
  actor      uuid not null references profile(id) on delete cascade,
  muted      uuid not null references profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor, muted),
  check (actor <> muted)
);

-- AND THE ONE PLACE A MUTE IS ANSWERED, beside block_hides() and in its
-- shape: one yes-or-no about the reader and `who`. `post_seen` carries it as
-- a column (`muted`) rather than leaving the row out, because a mute is NOT
-- 「see nothing of them」: their own page still shows what they wrote, and
-- only the lists that decision names ask for `muted=is.false` -- feed_hot()
-- and feed_fo() below, and the day's list, a thread and a search in
-- www/net.js. What they PASSED ON and what they DID TO YOU are asked of this
-- function by the person on the row: feed_fo()'s boost branch and notices()
-- (OWNER 2026-09-25). `security definer` for the reason block_hides() is.
create or replace function mute_hides(who uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from mute m
                  where m.actor = auth.uid() and m.muted = who)
$$;

-- ---- where a notice goes when the app is closed ----------------------------
-- 「通知作ろう。アップルのネイティブ通知で、フォローされた時、返信きた時みたい
--   な感じでSNS部分であるやつ。」 OWNER 2026-09-22.
--
-- One row per iPhone that has been allowed to be notified: the account, and
-- the device token Apple issued that installation of the app. It is THE
-- ADDRESS OF A PHONE and nothing else -- no name, no setting, nothing
-- anybody wrote.
--
-- One account has as many rows as it has phones, which is why the key is the
-- pair. A token is per (app, installation, device), so the same person on two
-- handsets is two rows and both are rung; the same handset signed in as two
-- accounts is also two rows, and the one that is rung is the one the notice
-- is for.
--
-- `(uid, token)` AND NOT `token` ALONE. Apple's token identifies an
-- installation, not a person, so signing out of one account and into another
-- on the same phone gives the same token under a second uid. With `token` as
-- the key the second sign-in would take the row off the first account, and
-- the first account would stop being notified because somebody else used
-- that phone once. Two rows is the truthful shape; which one is rung is
-- decided by the uid, which is what the notice is addressed to.
--
-- NOTHING ELSE IS ON THIS ROW. Not the model, not the iOS version, not when
-- it last spoke -- 「端末ごとにやることなんてねえよ」. A column here that
-- described the handset would be the phone becoming a thing the server knows
-- about, and the server knows about accounts.
--
-- Deleting the account takes it, the way it takes everything else:
-- 「アカウント削除で残るものねえって言ってんだろ何回言わせんだよ全部消える」.
--
-- AND THE SWITCHES ARE NOT HERE. Which kinds a person wants is
-- `profile.prefs` (`push_` + each kind in push-send's `PUSH`),
-- because it is the ACCOUNT's answer and not this handset's -- the same
-- sentence the theme and the interface language are under. A column here
-- would be the answer per phone, which is the thing 2026-09-03 took out of
-- this app.
create table if not exists device (
  uid        uuid not null references profile(id) on delete cascade,
  token      text not null check (token ~ '^[0-9a-fA-F]{32,200}$'),
  created_at timestamptz not null default now(),
  primary key (uid, token)
);
-- Asked one way only: supabase/functions/push-send reads every token of the
-- ONE account a notice is for.
create index if not exists device_uid_idx on device(uid);

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

-- ---- saying something TO the operator ---------------------------------------
-- 「設定にお問合せを足して欲しい。フォームみたいなの作ってみんなからの意見要望
-- バグとかあればそれを見たい。フォームはアプリ内のadminのページで見れるように
-- したい。」 OWNER 2026-09-22.
--
-- The same shape as `report` above, and not the same thing. A report is about
-- somebody ELSE and goes into a queue about them; this is about the APP, and
-- the person on the other end of it is whoever is going to fix it. What the
-- two share is the direction: written by the person, read only by whoever is
-- answering, and read back by nobody -- including the person who sent it,
-- because the only thing a road back would be for is a reply, and a reply is
-- not what was asked for.
--
-- `kind` is a closed set for the same reason `report.why` is: three words the
-- operator can count beat a box of free text nobody can sort. `body` is the
-- person's own words and is the whole of the rest of it.
--
-- WHAT IS NOT HERE: an update policy and a delete policy. Reading what
-- somebody wrote and then rewriting it is not an act anybody asked for, and
-- nobody deletes one through a policy.
--
-- THE OPERATOR DOES DELETE ONE. 「運営は消せるように。」 OWNER 2026-09-22 --
-- feedback_drop() at the foot of this file, the same shape as report_drop()
-- and for the same reason: a queue that only grows is a queue nobody reads.
-- The person who SENT it still cannot, which is the half that did not move.
create table if not exists feedback (
  id         bigint generated always as identity primary key,
  -- Nullable and `set null`, exactly as `report.actor` is, and for a reason
  -- of the same shape: deleting your own account must not quietly withdraw
  -- the bug report the operator has not got to yet. The words survive their
  -- author leaving; what goes is the @ beside them, which is honest -- there
  -- is nobody left to answer.
  author     uuid references profile(id) on delete set null,
  kind       text not null check (kind in ('opinion','request','bug')),
  -- A ceiling and a floor. The floor is what makes the send button's refusal
  -- mean something on the server too, rather than only in the app.
  body       text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists feedback_made_idx on feedback(created_at desc);

-- A SOLD PLACE IN THE TIMELINE. 「広告の形は、Twitterと同じ。ツイート擬態右上に
-- prとつく。広告枠が売れる形にする。」 OWNER 2026-09-23.
--
-- A promotion and not an advert: what is sold is a POST, written by the
-- advertiser's own account like any other, and this row says which post and
-- for how long. That is the Twitter shape the owner named, and it is why there
-- is no second kind of row to draw -- www/post.js draws a promoted post with
-- the one postRow() every post goes through, with PR in its corner. A table of
-- adverts with their own text and pictures would be a second post nobody can
-- like, reply to or report, and a second renderer to keep looking like the
-- first.
--
-- A TABLE OF ITS OWN, and not a column on `post`, for the reason `draft` is:
-- the author may update their own post (post_edit), and an author who could
-- set a flag on it could sell themselves a place.
--
-- NOBODY WRITES ONE THROUGH A POLICY. There is no insert, update or delete
-- policy, and each is deliberate: a place in somebody else's timeline is sold
-- by the operator, through the service role, which no policy applies to.
--
-- `on delete cascade`: an advertiser deleting their post takes its promotion
-- with it, because a promotion of nothing is not a thing anybody made -- it is
-- the operator's note about a post, and the post is what it was about.
create table if not exists promo (
  id         bigint generated always as identity primary key,
  post       uuid not null references post(id) on delete cascade,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists promo_run_idx on promo(starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Every table is denied by default the moment this is enabled, and each policy
-- below opens exactly one door. Read them as sentences: who, may do what, to
-- which rows.
--
-- An anonymous session cannot write anything at all. Supabase gives an
-- anonymous sign-in a real uid, so "not signed in" is not the test -- the JWT
-- carries is_anonymous, and that is what every writing policy checks through
-- is_member(). Reading is the grants' question and not the policies': `anon`,
-- which is what a request with nobody signed in arrives as, holds nothing at
-- all (the block at the foot of this file).
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
alter table language_take enable row level security;
alter table publication enable row level security;
alter table post        enable row level security;
alter table quote       enable row level security;
alter table react       enable row level security;
alter table prompt      enable row level security;
alter table follow      enable row level security;
alter table block       enable row level security;
alter table mute        enable row level security;
alter table device      enable row level security;
alter table report      enable row level security;
alter table feedback    enable row level security;
alter table draft       enable row level security;
alter table saved_search enable row level security;
alter table recent_search enable row level security;
alter table plan        enable row level security;
alter table purchase    enable row level security;
alter table promo       enable row level security;

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
-- nothing else. Every writing policy stands on this function and none of them
-- says the word anonymous.
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

-- And the one account above that. IT IS THE @ AND NOT A COLUMN.
--
-- 「＠linguaのアカウントだけ管理者ページには入れる」 OWNER 2026-08-26, and
-- 「@で決めたんじゃないの？」 OWNER 2026-09-03 -- asked because this did not
-- do it. It read `profile.admin`, a column that a trigger set at the moment a
-- row with the handle `lingua` was inserted. So it followed the @ for one
-- instant and was a separate fact from then on: a flag that exists is a flag
-- that can be written, and every defence of it was a grant somewhere else
-- that had to stay correct.
--
-- The handle IS the account's name and it is unique, so there is nothing to
-- set and nothing to forge. Two people cannot both be `lingua`, and somebody
-- who renames themselves to it cannot: `handle` is in the UPDATE grant below,
-- and profile_rename() refuses a rename onto it or off it.
--
-- `profile.admin` is not dropped. It is somebody's stored row and this file
-- does not delete data (docs/DATA_SAFETY.md); nothing reads it any more and
-- nothing writes it.
--
-- THE NAME IS WRITTEN HERE AND NOWHERE ELSE. profile_admin() is the one place
-- that says which row is the one above staff, and everything that needs to
-- know -- is_admin() below, the three triggers, staff_drop(), the first
-- follow -- asks it of a row. It takes the row rather than a handle so that
-- the app can ask it too, of every row it reads: PostgREST serves a function
-- of the table's own row as a column (`select=handle,admin:profile_admin`),
-- which is how the staff list says which of its rows cannot be taken off.
-- tools/rls-check.mjs counts the name in this file and wants one.
create or replace function profile_admin(p profile) returns boolean
language sql stable as $$ select p.handle = 'lingua' $$;

create or replace function is_admin() returns boolean
language sql stable as $$
  select exists (select 1 from profile p where p.id = auth.uid() and profile_admin(p))
$$;

-- profile: everyone reads, you write yourself into existence and edit yourself
drop policy if exists profile_read on profile;
create policy profile_read on profile for select using (true);
drop policy if exists profile_make on profile;
create policy profile_make on profile for insert with check (is_member() and id = auth.uid());
drop policy if exists profile_edit on profile;
create policy profile_edit on profile for update using (is_member() and id = auth.uid())
                                              with check (id = auth.uid());

-- language: who may read one is lang_readable() above, and nothing here says it
-- again. Only the owner ever writes.
--
-- is_member(), the same question posting asks. 「言語はアカウントないと作れない
-- です」「ログインした人しか書けないけど」 -- OWNER 2026-08-26. It used to be
-- has_account(), which anonymous satisfied, on the grounds that a language was
-- nobody else's business until it was published. It is not: it can be handed
-- over whole, and it can be put on a page anybody may open, so making one and
-- posting one are the same kind of act and ask the same thing.
--
-- Reading does not ask it, and that is not an oversight: a published language
-- is readable by everybody signed in, which is what publishing one MEANS.
-- Somebody with no session reads nothing -- that is the grants' answer, at the
-- foot of this file, and not this policy's.
drop policy if exists language_read on language;
create policy language_read on language for select
  -- Somebody who took it reads the row whatever it says now: the launch asks
  -- `language?id=in.(…)` for the rows of what this account has taken
  -- (netTakenDown in www/net.js), and a row refused here is a language with
  -- no name, no writing system and nothing said about it.
  using (lang_readable(id));
drop policy if exists language_make on language;
create policy language_make on language for insert
  with check (is_member() and owner = auth.uid());
drop policy if exists language_edit on language;
create policy language_edit on language for update
  using (is_member() and owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists language_drop on language;
create policy language_drop on language for delete
  using (is_member() and owner = auth.uid());

-- language_take: your own rows and nobody else's, in all three directions.
-- Who has taken a language is not something the app shows anybody -- it is
-- what a ceiling counts -- so there is no 「published」 half here the way
-- `language_read` has one. B may not read A's rows, may not write one for A,
-- and may not delete one of A's.
drop policy if exists take_read on language_take;
create policy take_read on language_take for select
  using (uid = auth.uid());
drop policy if exists take_make on language_take;
-- AND ONLY A LANGUAGE THAT IS PUBLISHED RIGHT NOW MAY BE TAKEN.
-- 「非公開にしたら新規 dl だけできないだけ」 OWNER 2026-09-09. This is the half
-- of that sentence that closes: the reading half is language_took() above,
-- which keeps the people who already took it. The article is not drawn for an
-- unpublished language, so there is no ↓ to press -- and a door that exists
-- only in the app is a door, so it is refused here as well.
create policy take_make on language_take for insert
  with check (is_member() and uid = auth.uid()
              and exists (select 1 from language l
                           where l.id = language_take.language
                             and l.published_at is not null));
drop policy if exists take_drop on language_take;
create policy take_drop on language_take for delete
  using (is_member() and uid = auth.uid());
grant select, insert, delete on language_take to authenticated;

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
-- AND THE DICTIONARY AND THE GRAMMAR OPEN ON A SECOND ANSWER, never on this
-- one. 「言語ページ公開と単語や文字のdl可能は別だし」 OWNER -- being allowed to
-- READ somebody's page and being handed the months of work behind it are two
-- questions, and publishing the page answers only the first. The second is the
-- owner's own DL switch, section by section, and `slice_dl()` below is where
-- this file reads it. 「あとdlは単語文字文法キーボード全部のはずだよね？」 OWNER
-- 2026-09-02: all four sections can be handed over, and the grammar is `phases`
-- and `gram2` because a grammar is both.
--
-- `lines`, `notes`, `talk` and `lang` are nobody else's at any setting.
--
-- `published_at` is what the About page's own switch writes -- setWldHide()
-- in www/home.js through netLangPublic() in www/net.js. Turning the switch
-- off writes null back and the door shuts: nothing is destroyed, nothing is
-- copied, and the page comes back exactly as it was left.
--
-- Writing is unchanged and is the owner's alone. Publishing is a page being
-- readable, never a way in.
alter table slice enable row level security;
alter table slice_hist enable row level security;

-- ---- what this file has done once ---------------------------------------
-- This file is pasted again and again, and nearly everything in it says what
-- is TRUE -- saying it a second time changes nothing. A step that MOVES
-- something is not like that: run on the tenth paste, it would do again what
-- a person has undone since the first. So a step that must happen once writes
-- its name here when it has happened, and asks this table before it runs.
-- Nothing about anybody is on it: the name of a step and when it ran. Row
-- level security with no policy, so nobody the app signs in as reads it.
create table if not exists schema_step (
  step text primary key,
  at   timestamptz not null default now()
);
alter table schema_step enable row level security;

-- THE LANGUAGE'S NAME, FROM WHERE IT USED TO BE (r60-up B3). Before the
-- column, a language's name was the `lang` slice, and a language made then
-- has an empty `language.name` -- which is the half everybody else reads, so
-- to them it had no name. It was the phone's launch that copied it
-- (`netLangsWalk` in www/net.js), which is a launch writing to the server;
-- it is here now, once.
--
-- A COPY: the slice is not touched (docs/DATA_SAFETY.md -- a migration
-- copies and never removes what it read). ONLY INTO AN EMPTY NAME: a name
-- already there is somebody's answer. And ONCE, because an empty name is also
-- a thing a person does on purpose -- 「空は未設定」 OWNER 2026-09-06 -- and a
-- copy that ran on every paste would put the old name back over that.
do $step$
begin
  if not exists (select 1 from schema_step where step = 'language.name from lang') then
    update language l set name = s.body
      from slice s
     where s.language = l.id and s.kind = 'lang'
       and l.name = '' and s.body <> '';
    insert into schema_step(step) values ('language.name from lang');
  end if;
end
$step$;

-- Whether the OWNER of a language has said that one section of it may be taken
-- away. 「言語ページ公開と単語や文字のdl可能は別だし」 -- publishing a page and
-- handing a chapter over are two answers, and this is the second one.
--
-- The answer lives in the `wld` slice, which is the article: `secs.<section>.dl`
-- when somebody has answered for that section, and the page-wide `dl` when
-- nobody has. That is wldSecDl() in www/home.js written out again, and the two
-- have to agree -- a reader offered a ↓ the server then refuses is the shape
-- 「ダウンロードボタン押しても言語追加されないけど？」 named.
--
-- Unreadable, absent or anything this does not understand is FALSE. A section
-- nobody can prove was opened stays shut: the failure of a policy is somebody
-- else's dictionary going out, so it fails towards refusing.
create or replace function slice_dl(lang uuid, sec text) returns boolean
language plpgsql stable as $$
declare w jsonb; o jsonb;
begin
  select s.body::jsonb into w from slice s
   where s.language = lang and s.kind = 'wld';
  if w is null then return false; end if;
  o = w -> 'secs' -> sec;
  if o is not null and o ? 'dl' then return (o -> 'dl') = 'true'::jsonb; end if;
  return (w -> 'dl') = 'true'::jsonb;
exception when others then
  return false;
end $$;

-- AND THE PREVIOUS VERSIONS, WHICH ARE THE OPERATOR'S ALONE. One policy on
-- this table and it is SELECT: no insert, no update and no delete policy
-- exists for slice_hist, so the trigger above (definer) is the only road in
-- and nothing signed in can forge, rewrite or drop a version -- including the
-- person whose language it is, and including staff.
drop policy if exists slice_hist_read on slice_hist;
create policy slice_hist_read on slice_hist for select
  using (is_staff());

drop policy if exists slice_read on slice;
create policy slice_read on slice for select
  -- WHETHER the language may be read at all is lang_readable() above -- yours,
  -- taken (「非公開にしたら新規 dl だけできないだけ」 OWNER 2026-09-09), or
  -- published with no block between -- and it is asked once, first. What
  -- follows is only WHICH slices of it come down.
  using (
    lang_readable(language)
    and (
    exists (select 1 from language l
             where l.id = language and l.owner = auth.uid())
    -- What the ARTICLE is drawn from, because the page cannot be read
    -- otherwise.
    or kind in ('wld', 'script', 'snd', 'letters', 'kb')
    -- And what may be TAKEN: 「あとdlは単語文字文法キーボード全部のはずだよね？」
    -- OWNER 2026-09-02. The dictionary and the grammar were refused to everybody
    -- but their owner, so two of the four ↓ could never have landed. They are
    -- open now on a published language AND only where its owner's own switch
    -- says so -- WLD_DL_KIND in www/home.js is the other half of this list, and
    -- the grammar is two slices because a grammar is.
    -- The taker keeps these on the SAME second answer and not on a wider
    -- one: a language whose dictionary was never offered does not start
    -- offering it by going private.
    or (kind in ('words', 'phases', 'gram2')
        and slice_dl(language,
                     case kind when 'words' then 'words' else 'gram' end))
    )
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
-- WHO SOMEBODY IS, WITH THE TWO NUMBERS A PROFILE IS MADE OF.
--
-- 「当たり前だけどsnsとして機能してない」 OWNER 2026-09-01. A person's page
-- showed 0 followers and 0 following for everybody, always -- www/me.js says
-- so in a comment: 「Neither is on `profile` at all -- see netWho()」. It was
-- true. `follow` was written by netFollow() and read back only about
-- YOURSELF (netFollowing/netFollowers ask `follower=eq.me` / `followed=eq.me`),
-- so the two numbers on somebody else's page had nowhere to come from.
--
-- A VIEW rather than two more requests from the phone, and rather than
-- letting the phone download somebody's followers to count the rows: a count
-- is one number and shipping a list to produce it is how a popular account
-- becomes a slow page.
--
-- It exposes nothing new. `follow_read` is `using (true)` -- who follows whom
-- is public, which is what a follower list IS -- and every column named here
-- is already readable by everybody signed in through `profile_read`, also
-- `using (true)`. What
-- it does NOT carry is `staff`, `admin` and `banned_why`: they are on
-- `profile` and readable there, and there is no reason for a view about a
-- person's page to be the thing that hands them out.
-- HOW BIG A LANGUAGE IS, WITHOUT HANDING IT OVER.
--
-- 「言語の詳細は？」 OWNER 2026-09-01, in the same breath as the bio. A
-- person's page could say the NAME of their language and nothing else --
-- netLangNames() asked for `owner,name` -- so there was nowhere to go from
-- it and nothing to know about it.
--
-- The article, the writing system, the sounds, the letters and the keyboard
-- are open on a published language, because the page is drawn from them:
-- `slice_read` says so. The DICTIONARY and the GRAMMAR are open only where
-- their owner's own switch says a reader may take them -- `slice_dl()` above,
-- which is 「言語ページ公開と単語や文字のdl可能は別だし」 written as a policy.
-- Reading this count needs neither: it is a number about the language, the way
-- a page count is a number about a book.
--
-- So the count is computed HERE and the words never move. `nwords` is a
-- number about the language the way a page count is a number about a book;
-- it is not a page of it. **This is the one place where what publishing
-- exposes has been widened, and it is widened by exactly one integer per
-- slice.** If that is not wanted, delete the two `slice_count` lines and the
-- column goes; nothing else depends on them.
--
-- Reading is lang_readable(), asked by the view because a VIEW runs with the
-- definer's rights and would otherwise hand out every unpublished language in
-- the table.
create or replace function slice_count(b text) returns int
language plpgsql immutable as $$
begin
  /* The body is the string localStorage holds -- an array for `words` and
     for `letters`. Anything else is 0 rather than an error: a slice that has
     never been written, or one holding something this does not understand,
     is a language with none of that thing as far as a reader is concerned,
     and a page that cannot draw because a count threw is worse than a zero. */
  if b is null then return 0; end if;
  /* jsonb_array_length() of a null answers NULL rather than raising, so the
     line above is not covered by the handler below and has to be its own. */
  return coalesce(jsonb_array_length(b::jsonb), 0);
exception when others then
  return 0;
end $$;

-- DROPPED FIRST, EVERY ONE OF THEM. `create or replace view` may add a
-- column at the END and may not put one in the middle or rename one, and a
-- real server holds whatever view was pasted last time: 2026-09-15 the paste
-- stopped at 「cannot change name of view column "nwords" to "wsys"」 and not
-- one line of this file landed. `cascade` takes the SQL-language functions
-- that read the view with it (notices, feed_hot, feed_fo read post_seen);
-- every one of them is made again further down, so nothing is lost and the
-- file stays the one paste that leaves any server in today's shape.
-- tools/rls-check.mjs applies the 2026-09-08 file first and this one over it.
drop view if exists language_seen cascade;
create view language_seen as
  select l.id, l.owner, l.name, l.license, l.published_at, l.created_at, l.wsys,
         slice_count((select s.body from slice s
                       where s.language = l.id and s.kind = 'words'))   as nwords,
         slice_count((select s.body from slice s
                       where s.language = l.id and s.kind = 'letters')) as nletters
    from language l
   -- lang_readable() above, the same question `language_read` asks: a view
   -- runs with its owner's rights, so this `where` is the whole of what stands
   -- between a reader and the table.
   where lang_readable(l.id);
grant select on language_seen to authenticated;

-- AND THE LANGUAGE BESIDE THE PERSON, IN THE SAME ANSWER.
-- 「他人のフォロー／フォロワーとか見る時すんごいくるくる回ってるけど、なんか
--  全体的に遅くない？」 OWNER 2026-09-08 (143).
--
-- It was a SECOND request. netLangNames() in www/net.js asked `language` by
-- owner once the people had come back, so every screen that draws a list of
-- people paid two round trips one after the other -- and a round trip on a
-- phone is 100-300ms whatever is in it. Measured with tools/slow-check.mjs:
-- somebody else's follower list was four round trips deep and this was the
-- last of them.
--
-- It could not be an embed and still cannot: `language.owner` points at
-- auth.users and `profile.id` is its own key, so there is no foreign key for
-- PostgREST to travel and asking for `language(name)` answers PGRST200 for
-- everybody. What there IS is the same uuid on both sides, and joining on it
-- is a thing SQL can do perfectly well -- it is only PostgREST that needed a
-- key to follow. So the join is made here, once, and the view is what the
-- phone asks for.
--
-- THROUGH language_seen AND NOT `language`, so the rule about which languages
-- a stranger may see is written in one place: `published_at is not null or
-- owner = auth.uid()`, which is the same policy netLangNames() asked with.
--
-- WHICH ONE, when somebody has several: the OLDEST, by `created_at`, which is
-- what netLangNames() picked and for the reason it gave -- an unordered pick
-- gives a person a different tag every time somebody looks at them. It is not
-- a decision about which language represents somebody; nothing has asked
-- that.
-- ---- who follows whom, by the name one person knows another by -------------
-- 「他人のフォロー／フォロワーとか見る時すんごいくるくる回ってる」 OWNER
-- 2026-09-08 (143).
--
-- `follow` is keyed by uuid on both sides, and the app has never held anybody
-- else's uuid: every screen in it speaks handles. So asking for somebody's
-- follow list took TWO round trips -- one to turn the handle into a uuid
-- (netWhoseId in www/net.js), and then the real one -- and the first was pure
-- waiting. Measured with tools/slow-check.mjs: somebody else's follower list
-- was four round trips deep and this was the first of them.
--
-- The join is made here so the phone can ask its question in the words it
-- already has. Both keys are on it: a person's own list is asked by uuid,
-- because that is what a session carries and a phone that has not been given
-- a handle yet still has one.
--
-- `follow_read` is `using (true)` -- who follows whom is public the way it is
-- in every timeline -- so this view shows exactly what that policy already
-- shows and adds nothing.
--
-- AND WHEN, because that is the order a list is read in: 「フォロー中・
-- フォロワーの並び → フォローした新しい順で」 OWNER 2026-09-24. The column
-- was on `follow` from the first day and this view left it behind.
drop view if exists follow_seen cascade;
create view follow_seen as
  select f.follower, f.followed, f.created_at,
         a.handle as follower_handle,
         b.handle as followed_handle
    from follow f
    join profile a on a.id = f.follower
    join profile b on b.id = f.followed
   -- a row naming somebody a block stands between is not a row (block_hides)
   where not block_hides(f.follower) and not block_hides(f.followed);
grant select on follow_seen to authenticated;

-- ---- who liked a post, and who passed it on, by name -----------------------
-- 「リツイートといいねした人長押しで見れるようにしたい」 OWNER 2026-09-25
-- (docs/FEATURE_RULES.md § 2026-09-25 いいね・リポストした人の一覧…). The
-- list is drawn the way the follows lists are -- one page of handles, newest
-- first, and the people on it asked for by handle (www/me.js § fol*) -- so
-- this is follow_seen's shape: the row with the name the phone speaks, and
-- the time it is ordered by.
--
-- `react_read` is `using (true)`, so this shows no more than the table does.
-- What it leaves out is what a list of people leaves out: somebody a block
-- stands between, either way, and -- the owner's word for 「not in the lists
-- you scroll」 -- somebody the reader has muted (block_hides, mute_hides).
-- And no list at all for a post by somebody a block stands between
-- (post_blocks): the post is not there to hold.
drop view if exists react_seen cascade;
create view react_seen as
  select r.post, r.kind, r.created_at, a.handle as actor_handle
    from react r
    join profile a on a.id = r.actor
   where not block_hides(r.actor) and not mute_hides(r.actor)
     and not post_blocks(r.post);
grant select on react_seen to authenticated;

-- ---- whether somebody wears the mark, and the one place it is answered ------
-- 「課金者にちゃんと投稿とかプロフィールにダイヤ見えるようになってる？」
-- 「入れるよ？」 OWNER 2026-09-26. The mark was drawn by the phone that wrote
-- the post and nowhere else, because the plan is private (plan_read is the
-- owner's alone) and no row anybody else reads carried an answer.
--
-- ONE BOOLEAN IS PUBLISHED AND NOTHING ELSE. Not the rung, not the product,
-- not the date: free and plus both answer false. The mark exists to be seen,
-- what somebody pays does not.
--
-- THE RUNG IS THE `plan` ROW'S, because that is where a rung is decided --
-- verify-plan from the purchases, and plan_staff_hold() for staff -- and a
-- second product-to-rung table here would be a second ladder. What is asked
-- of `purchase` is only whether the row has OUTLIVED what paid for it: a
-- plan row is rewritten when its owner's phone calls verify-plan, so somebody
-- who cancels and never opens the app again would otherwise wear the mark
-- for ever, which is the one thing 「バッジは消える」 forbids. So the row
-- counts while a purchase of theirs is still running (`until` ahead, nothing
-- revoked), or while they are staff -- the other road a row becomes Pro,
-- which has no purchase to outlive.
--
-- KNOWN LIMIT: somebody whose Pro ran out while a Plus of theirs is still
-- running wears the mark until their phone next calls verify-plan and the row
-- comes down to plus. Telling those apart here needs the product table, and
-- that is verify.mjs's (PRODUCTS).
--
-- Which rung wears it is www/core.js's `CAN.badge`, and badge_rung() says it
-- again in the only language this file has -- tools/rls-check.mjs reads both
-- and fails when they differ.
--
-- `security definer`, because it reads `plan` and `purchase`, whose read
-- policies are their owner's alone, and must: it hands out one yes-or-no and
-- no row. anon holds no grant to ask (the foot of this file).
create or replace function badge_rung()
returns text language sql immutable as $$ select 'pro'::text $$;

create or replace function badge_of(who uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from plan pl
     where pl.id = who and pl.plan = badge_rung()
       and (exists (select 1 from profile s where s.id = who and s.staff)
            or exists (select 1 from purchase u
                        where u.uid = who and u.revoked is null
                          and (u.until is null or u.until > now()))))
$$;

drop view if exists profile_seen cascade;
create view profile_seen as
  select p.id, p.handle, p.display, p.av, p.bio, p.link, p.loc, p.banned_at,
         badge_of(p.id) as badge,
         (select count(*) from follow f where f.follower = p.id) as fo,
         (select count(*) from follow f where f.followed = p.id) as fr,
         l.id                          as lang_id,
         l.name                        as lang_name,
         (l.published_at is not null)  as lang_pub
    from profile p
    left join lateral (
      select ls.id, ls.name, ls.published_at
        from language_seen ls
       where ls.owner = p.id
       order by ls.created_at asc
       limit 1
    ) l on true
   -- a person a block stands between is nobody, both ways (block_hides)
   where not block_hides(p.id);
grant select on profile_seen to authenticated;

-- ---- whom you have blocked, by name ---------------------------------------
-- 「ブロックの解除 → 設定に追加して非表示リストとブロックリスト」 OWNER
-- 2026-09-24. A blocked person's page is gone from both sides (profile_seen
-- above), so the list in the settings is where a block is lifted, and this
-- is what it draws: YOUR rows and the name on each.
--
-- It runs as its owner, so `block_read` is not what keeps it yours -- the
-- `where` is. rls-check: 「BD cannot read that BD is blocked there」.
drop view if exists block_seen cascade;
create view block_seen as
  select b.blocked as id, p.handle, p.display, p.av, b.created_at
    from block b
    join profile p on p.id = b.blocked
   where b.actor = auth.uid();
grant select on block_seen to authenticated;

-- ---- whom you have muted, by name -----------------------------------------
-- 「設定の「非表示リスト」がミュートした人の一覧で、そこから解除する」 OWNER
-- 2026-09-25. block_seen's shape, for the same reason and with the same
-- `where` keeping it yours. rls-check: 「MD cannot read that MD is muted」.
drop view if exists mute_seen cascade;
create view mute_seen as
  select m.muted as id, p.handle, p.display, p.av, m.created_at
    from mute m
    join profile p on p.id = m.muted
   where m.actor = auth.uid();
grant select on mute_seen to authenticated;

-- A POST KEPT TO YOURSELF is read by the person who wrote it and by nobody
-- else -- not a follower, not the person it answers, not staff.
-- 「SNSは全部サーバー」 and 「NOTHING IS THE PHONE'S」 (CLAUDE.md § Online):
-- it lived on the phone that wrote it and nowhere else until 2026-09-23, which
-- made it the one thing somebody wrote that a lost phone took with it.
--
-- The mark is `body.pv`, where it has always been on the phone -- a post's
-- fields travel in `body` (www/net.js § netBody) -- so there is no column and
-- nothing to grant. This is the ONE place that says what the mark is, and
-- every reader asks it: the table's read policy (post_read), post_seen, which
-- reads the table as its owner and so has to ask for itself (the row and the
-- count of replies), and the trigger that rings somebody when they are
-- answered. A reader added tomorrow asks this, or it is a second answer.
create or replace function post_private(b jsonb) returns boolean
language sql immutable as $$
  select coalesce(b ->> 'pv', '') not in ('', '0', 'false')
$$;

drop view if exists post_seen cascade;
create view post_seen as
  select p.id, p.author, p.language, p.prompt, p.reply_to, p.created_at,
         p.hidden_at,
         (a.banned_at is not null) as author_out,
         -- WHETHER WHOEVER WROTE IT WEARS THE MARK, NOW (badge_of above). Not
         -- on the post's body: everything there is past tense on purpose, and
         -- a mark stamped on at the moment of writing would stay on somebody
         -- who cancelled -- 「バッジは消える」. So it is asked here, of the
         -- author as they are today, on every read.
         badge_of(p.author) as badge,
         -- WHAT IT QUOTES, AS THAT POST IS NOW. The id is the quote's own; the
         -- post under it is read here, by the reader, every time: a quote of
         -- a post since deleted, taken down, frozen with its account, kept to
         -- its author, or written by somebody a block stands between is
         -- `quoted` null -- 「この投稿は表示できません」 OWNER 2026-09-25 -- and
         -- the id is still there to say it was a quote. The conditions are
         -- this view's own `where` below, with the two a row here only marks
         -- (taken down, frozen) asked as well, because a post under a post
         -- has nowhere to wear the mark.
         p.quote_of,
         (select jsonb_build_object('id', q.id, 'author', q.author,
                                    'created_at', q.created_at, 'body', q.body,
                                    'badge', badge_of(q.author))
            from post q join profile qa on qa.id = q.author
           where q.id = p.quote_of
             and q.hidden_at is null and qa.banned_at is null
             and (not post_private(q.body) or q.author = auth.uid())
             and not block_hides(q.author)) as quoted,
         case when p.hidden_at is null or p.author = auth.uid() or is_staff()
              then p.body else '{}'::jsonb end as body,
         -- WHAT OTHER PEOPLE DID TO IT.
         --
         -- 「当たり前だけどsnsとして機能してない」 OWNER 2026-09-01. Liking
         -- and boosting were WRITTEN -- netMark() in www/net.js posts a row
         -- into `react` and deletes it again -- and there was **no GET of
         -- /rest/v1/react anywhere in the app**. So the number went up on the
         -- phone that pressed it and nowhere else, and opening the timeline
         -- again showed nothing: every count was whatever this phone
         -- happened to remember.
         --
         -- feed_hot() below was already counting these to ORDER by them and
         -- throwing the numbers away, which is the whole shape of the bug --
         -- the data was there, the query was there, and nobody asked for the
         -- answer.
         --
         -- Counted here rather than by the phone because a phone can only
         -- count the reactions it was handed, and it is handed none.
         (select count(*) from react r
           where r.post = p.id and r.kind = 'like')  as likes,
         -- AND A QUOTE IS A REPOST. 「リツイートと同じ数の数え方で足して
         -- っていい」 OWNER 2026-09-26: the number beside the repost mark is
         -- the reposts and the quotes together, and no number of quotes on
         -- its own is drawn. This is the one place it is counted -- the
         -- timeline, a thread and a person's page all read this column, and
         -- the feeds below hand it on as it is. A quote is a post, so it is
         -- asked of `post` as the replies are just below, on the same terms:
         -- one taken down or kept to its author is not a repost anybody can
         -- open. Who reposted (react_seen) is still the `react` rows alone.
         (select count(*) from react r
           where r.post = p.id and r.kind = 'boost')
       + (select count(*) from post q
           where q.quote_of = p.id and q.hidden_at is null
             and not post_private(q.body)) as boosts,
         -- A reply is a post, so this is the same question asked of the same
         -- table. Taken-down replies are not counted: a count that includes
         -- what nobody can open is a number with nothing behind it.
         (select count(*) from post q
           where q.reply_to = p.id and q.hidden_at is null
             and not post_private(q.body)) as replies,
         -- AND WHETHER THIS READER IS ONE OF THEM, which is a different
         -- question from how many and cannot be worked out from the count.
         -- Signed out, auth.uid() is null and both are false -- correct:
         -- somebody with no account has not liked anything.
         exists (select 1 from react r
                  where r.post = p.id and r.kind = 'like'
                    and r.actor = auth.uid()) as i_like,
         exists (select 1 from react r
                  where r.post = p.id and r.kind = 'boost'
                    and r.actor = auth.uid()) as i_boost,
         -- AND WHETHER THE READER HAS MUTED WHOEVER WROTE IT (mute_hides).
         -- A column and not a `where`: the lists that leave a muted person
         -- out ask for it, and their own page does not.
         mute_hides(p.author) as muted
    from post p left join profile a on a.id = p.author
   -- and a post kept to yourself is not a row for anybody else (post_private),
   -- and one by somebody the reader blocked is not a row for them (block_hides).
   where (not post_private(p.body) or p.author = auth.uid())
     and not block_hides(p.author);
grant select on post_seen to authenticated;

-- post: everyone reads, you write as yourself.
--
-- Everything is readable by everybody signed in, for now; locked accounts come
-- later. When they
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
  (hidden_at is null or author = auth.uid() or is_staff())
  -- and one kept to yourself is yours alone, staff included (post_private)
  and (not post_private(body) or author = auth.uid())
);
drop policy if exists post_make on post;
create policy post_make on post for insert with check (
  is_member() and author = auth.uid()
  -- not an answer to somebody a block stands between, nor a quote of them
  -- (post_blocks)
  and (reply_to is null or not post_blocks(reply_to))
  and (quote_of is null or not post_blocks(quote_of)));
drop policy if exists post_edit on post;
create policy post_edit on post for update
  using (is_member() and author = auth.uid())
  with check (author = auth.uid() and (reply_to is null or not post_blocks(reply_to)));
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

-- recent_search: the same four sentences, and the read is the one that
-- matters. What somebody has been LOOKING FOR is not what they published --
-- `profile_read` is `using (true)` and this must never be, or a history is a
-- list of every name a person typed, readable by every account there is.
-- Nothing would throw and every screen would be right.
drop policy if exists recent_read on recent_search;
create policy recent_read on recent_search for select using (is_member() and author = auth.uid());
drop policy if exists recent_make on recent_search;
create policy recent_make on recent_search for insert with check (is_member() and author = auth.uid());
drop policy if exists recent_edit on recent_search;
create policy recent_edit on recent_search for update using (is_member() and author = auth.uid())
                                                   with check (author = auth.uid());
drop policy if exists recent_drop on recent_search;
create policy recent_drop on recent_search for delete using (is_member() and author = auth.uid());

-- plan: yours to read, yours to write, and nobody else's to do either.
--
-- 「課金とアカウントとキーボードはアカウントに結びつく」 OWNER 2026-09-01.
--
-- READING IS NOT `using (true)` and that is the whole reason this is not a
-- column on `profile`. What somebody pays is theirs. A tier is not a handle.
--
-- WRITING IS NOBODY'S through the API since 2026-09-06. B cannot make
-- themselves Pro on A's account, B cannot read what A pays, and A cannot set
-- their own either -- the owner of a row is a phone, and a phone does not say
-- what it has paid. supabase/functions/verify-plan writes with the service
-- role, which policies do not apply to; see the comment over the table.
--
-- There is no delete policy and that is deliberate rather than an omission.
-- A plan row is not somebody's work; it is a fact about their account, and
-- the account going takes it (`on delete cascade`). Nothing else may remove
-- it, and `docs/PAID_FEATURES.md` is why a missing row is harmless anyway:
-- no row reads as `free`, and free is the side to be wrong on.
drop policy if exists plan_read on plan;
create policy plan_read on plan for select
  using (is_member() and id = auth.uid());
-- `plan_make` and `plan_edit` were here until 2026-09-06 and are GONE, not
-- narrowed. They let the owner of a row write it, and the owner of a row is a
-- phone: 「だから端末でやるわけねえだろ」 OWNER 2026-09-03. The function writes
-- with the service role, which policies do not apply to, so taking these away
-- takes nothing from the app that is meant to work -- it takes away the one
-- that was never meant to.
--
-- Dropped by name above, so that a database this file has already been run on
-- loses them too. A policy left standing on a server nobody re-created is a
-- policy still in force, whatever this file says.
drop policy if exists plan_make on plan;
drop policy if exists plan_edit on plan;

-- AND THE ONE THING A PERSON MAY WRITE ON THEIR OWN PLAN ROW, WHICH IS NOT A
-- POLICY.
--
-- 「4 起動の時に表示して ☑️今後表示しない 閉じる みたいなポップにしたくない？」
-- OWNER 2026-09-12. Somebody ticking that box is the one fact about a plan row
-- that comes from the person rather than from Apple, so it needs a road up --
-- and the road may not be an insert or an update policy, because a policy is a
-- road to the WHOLE row and `plan` is the column somebody would set to 'pro'.
-- That is what 2026-09-06 closed and the comment over the table is why.
--
-- So it is a function and not a grant: it takes no argument, it writes one
-- column, and the row it writes is `auth.uid()`'s -- there is nothing here for
-- a caller to name, so there is nothing for them to name somebody else with.
-- B calling this marks B's own row and cannot reach A's.
--
-- security definer because the table has no update policy at all and must not
-- grow one. `is_member()` rather than a plain `auth.uid() is not null`: it is
-- the same sentence every write in this file asks, and it raises rather than
-- writing nothing, so a caller with no account is REFUSED rather than quietly
-- ignored.
--
-- A row that is not there is not an error. Nothing has answered for that
-- account yet, and the launch that would show the popup is the same launch
-- that makes the row -- so zero rows updated is the truthful answer and not a
-- failure to report.
create or replace function plan_lapse_seen()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_member() then raise exception 'not a member'; end if;
  update plan set lapse_seen_at = now() where id = auth.uid();
end $$;

-- AND THE ONE ROAD THE PLAN ITSELF COMES IN BY, which is verify-plan's.
--
-- It read the row, decided `was` and `lapse_seen_at` from what it read, and
-- wrote -- two requests with the row free between them, so two answers
-- arriving together could each read the old plan and one of them record the
-- wrong one (r63-audit SQ7). This is the same decision in one statement: the
-- conflict road holds the row it compares against. The three cases are the
-- column comment above:
--
--   down   `was` is the rung it held, `lapse_seen_at` null -- a new ending
--   up     both null -- the ending is over
--   same   both as they are -- an unticked notice stays to be shown again
--
-- The ladder is handed in (verify.mjs's `ORDER`, the one list of rungs), not
-- written here: two ladders are one more than there are. plan_staff_hold()
-- still has the last word, because it is a trigger on the row this writes.
--
-- Security invoker, and that is the whole of who may call it: `plan` has no
-- insert and no update policy, so the service role -- which row level
-- security does not apply to -- is the one caller whose write lands.
create or replace function plan_put(who uuid, rung text, ladder text[])
returns setof plan
language sql as $$
  insert into plan as o (id, plan, at) values (who, rung, now())
  on conflict (id) do update set
    plan = excluded.plan,
    at   = excluded.at,
    was  = case
             when array_position(ladder, excluded.plan) < array_position(ladder, o.plan)
               then o.plan
             when array_position(ladder, excluded.plan) > array_position(ladder, o.plan)
               then null
             else o.was end,
    lapse_seen_at = case
             when array_position(ladder, excluded.plan) <> array_position(ladder, o.plan)
               then null
             else o.lapse_seen_at end
  returning o.*
$$;

-- purchase: yours to read and nobody's to write.
--
-- READING IS THE OWNER'S, and not `using (true)`, for the same reason `plan`
-- is a table of its own: what somebody bought is not a handle.
--
-- There is no insert, update or delete policy, and every one of those is
-- deliberate. Insert and update would be somebody claiming a purchase --
-- which is the whole of what this table exists to stop. Delete would be
-- somebody unbinding a transaction from their own account and then binding it
-- to another one, which is the same attack walking backwards. The account
-- going takes the rows (`on delete cascade`); nothing else removes them.
drop policy if exists purchase_read on purchase;
create policy purchase_read on purchase for select
  using (is_member() and uid = auth.uid());

-- promo: everybody signed in reads the ones running NOW, and nobody writes.
--
-- The window is asked here rather than by the phone, so a promotion that has
-- ended is not handed to anybody -- a phone with the wrong clock cannot draw a
-- place that was paid for until yesterday. Nothing is said about the plan:
-- whether a reader SEES a promotion is www/core.js's can('noads'), because a
-- plan decides what a person may do and this row is not theirs.
drop policy if exists promo_read on promo;
create policy promo_read on promo for select
  using (starts_at <= now() and (ends_at is null or ends_at > now()));

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
  with check (is_member() and actor = auth.uid() and not post_blocks(post));
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

-- mute: YOURS and nobody else's, in every direction, for block's reason.
drop policy if exists mute_read on mute;
create policy mute_read on mute for select using (actor = auth.uid());
drop policy if exists mute_make on mute;
create policy mute_make on mute for insert
  with check (is_member() and actor = auth.uid());
drop policy if exists mute_drop on mute;
create policy mute_drop on mute for delete using (is_member() and actor = auth.uid());

-- device: YOURS and nobody else's, in every direction -- the same four lines
-- block is under, and for a harder reason.
--
-- A row here is the address of somebody's phone. Written by anybody else it
-- rings a phone that is not theirs; read by anybody else it is a token that
-- can be written into their own row and then rung on purpose. So there is no
-- `using (true)` anywhere below, no update policy at all (a token does not
-- change -- a new one is a new row and the old one goes), and `uid` is
-- refused from the outside in both directions.
--
-- AND THE ADDRESS OF A PHONE IS THE ACCOUNT SIGNED IN ON IT NOW.
-- 「端末ごとにやることなんてねえよ」 OWNER 2026-09-03: a phone is a window,
-- and whoever is looking through it is who its notices are for. device_one()
-- is the one place that says it, on the way in:
--   - the same account sending the same token again is nothing to do. Every
--     launch sends it (PostgREST's merge-duplicates), and the conflict took
--     the update road, which there is no policy for -- so from the second
--     launch on it was refused (r63-audit S5, measured).
--   - a token arriving for this account is no longer any other account's.
--     Somebody who signs in on a phone somebody else left signed in takes
--     its notices with it; before, the first account's rang there too
--     (r63-audit S4). docs/CHANGELOG.md 2026-09-24 carries the DELETE REVIEW.
-- Only for a row that is the caller's own. A row naming somebody else is
-- left to the policy below, which refuses it -- so the trigger never tells
-- anybody anything about a row that is not theirs.
create or replace function device_one() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.uid is distinct from auth.uid() then return new; end if;
  if exists (select 1 from device where uid = new.uid and token = new.token) then
    return null;
  end if;
  delete from device where token = new.token and uid <> new.uid;
  return new;
end $$;
drop trigger if exists device_one on device;
create trigger device_one before insert on device
  for each row execute function device_one();

--
-- The one thing that is not the person: supabase/functions/push-send deletes
-- a row Apple has answered `410 Unregistered` for. That runs with the service
-- role, which no policy applies to -- and it is written down here because a
-- row that can disappear without its owner doing anything is a thing to be
-- able to find. docs/CHANGELOG.md 2026-09-22 carries the DELETE REVIEW.
drop policy if exists device_read on device;
create policy device_read on device for select using (is_member() and uid = auth.uid());
drop policy if exists device_make on device;
create policy device_make on device for insert
  with check (is_member() and uid = auth.uid());
drop policy if exists device_drop on device;
create policy device_drop on device for delete using (is_member() and uid = auth.uid());

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
-- No update policy and no delete policy, for anybody: a report that can be
-- withdrawn by the person it is about is not a report.
--
-- Staff DO delete one, and it is not a policy -- report_drop() at the foot of
-- this file, the same shape as post_hide(). 「通報で問題なかったらその通報が
-- 消せるようにしてほしい」 OWNER 2026-09-05: a report that was looked at and
-- found to be about nothing is not a record of a decision, it is a row in a
-- queue that has been answered, and a queue that only grows is a queue nobody
-- reads.
drop policy if exists report_read on report;
create policy report_read on report for select using (is_staff());
drop policy if exists report_make on report;
create policy report_make on report for insert
  with check (is_member() and actor = auth.uid());

-- feedback: you write your own and read none of them; staff read them all.
--
-- The select side is `report_read`'s sentence with a different table under
-- it. The insert side pins `author` to the account asking, so a phone cannot
-- send a complaint in somebody else's name -- the app puts SESS.uid there and
-- this is what makes that true rather than polite.
--
-- No update policy and no delete policy, for anybody, staff included. See the
-- table above for why: what happens to one after it has been read is not a
-- thing anybody has decided, and a policy written ahead of that decision is
-- the decision.
drop policy if exists feedback_read on feedback;
create policy feedback_read on feedback for select using (is_staff());
drop policy if exists feedback_make on feedback;
create policy feedback_make on feedback for insert
  with check (is_member() and author = auth.uid());

-- follow: everyone sees who follows whom; you add and remove your own following
drop policy if exists follow_read on follow;
create policy follow_read on follow for select using (true);
drop policy if exists follow_make on follow;
create policy follow_make on follow for insert
  with check (is_member() and follower = auth.uid() and not block_hides(followed));
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
-- Read by whoever is signed in, which is who reads a post (post_read above):
-- a picture on one is part of the post. The app reads a file with the
-- person's own token on the request, not through a public URL.
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

-- Not public. What makes a bucket public or not is said once, for every
-- bucket, in the block at the foot of this file (anon holds nothing), so it
-- is not said here: a bucket is made with Storage's own default, which is
-- closed, and one that was made open before is closed by that block.
insert into storage.buckets (id, name)
values ('post-media', 'post-media')
on conflict (id) do nothing;

-- Whoever is signed in reads what is in this bucket, and only this bucket --
-- the same sentence `post_read` is under.
drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select
  using (is_member() and bucket_id = 'post-media');
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
-- follow are all readable by everybody signed in. Nothing here opens a door;
-- it walks through
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
               post uuid, n int, np int, more jsonb)
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
    -- a post of yours QUOTED (r94), and the notice opens the quote, the way a
    -- reply's opens the reply. Read under the reader's rights, so a quote
    -- kept to its author is not handed over (post_read).
    select 'quote', q.created_at, q.author, q.id
      from post q
      join post ps on ps.id = q.quote_of
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
      from ev
     /* Every notice is about the person in `actor`, and this is where they
        are asked about, once, for all four kinds: somebody blocked, and
        somebody muted -- 「その人からの通知（いいね・返信など）も出さない」
        OWNER 2026-09-25 (block_hides, mute_hides). */
     where not block_hides(ev.actor)
       and not mute_hides(ev.actor)
     group by ev.kind, ev.post
  ),
  /* ---- AND THE SECOND WAY OF BEING THE SAME NOTICE ---------------------
     The owner gave two shapes and the list only ever made one of them:

       several people, one post   -> 「A と B がいいねしました」
       one person, several posts  -> 「A が2件にいいねしました」

     `g` above is the first. It groups by (kind, post), so ONE person liking
     four of your posts came out as four rows saying the same name four
     times -- which is the shape of notice list that makes people turn
     notices off.

     The two cannot both be done by one `group by`, so this is the second
     pass and the rule is the narrowest one that produces both sentences:
     a row several people are in STAYS about the post, and the rows only one
     person is in are gathered by that person. Nothing is dropped and nothing
     is counted twice -- every event is in exactly one row either way.

     `n` and `np` are two numbers and not one, because they are two
     questions: how many PEOPLE this row is about, and how many POSTS. A
     screen needs both to choose its sentence, and a single number cannot
     say which kind of row it is. */
  many as (
    select g.kind, g.post, g.at, g.n, 1 as np, g.few
      from g where g.n > 1
  ),
  one as (
    select g.kind,
           /* The most recent of them, so tapping the row goes somewhere --
              a row about four posts still has to lead to one. */
           (array_agg(g.post order by g.at desc))[1] as post,
           max(g.at) as at,
           1 as n,
           count(*)::int as np,
           array[g.few[1]] as few
      from g where g.n = 1
     group by g.kind, g.few[1]
  ),
  r as (
    select * from many
    union all
    select * from one
  )
  select r.kind, r.at, p0.handle, p0.display, p0.av, r.post, r.n, r.np,
         coalesce((select jsonb_agg(jsonb_build_object(
                            'hd', p.handle, 'who', p.display, 'av', p.av)
                          order by u.ord)
                     from unnest(r.few[2:4]) with ordinality as u(id, ord)
                     join profile p on p.id = u.id), '[]'::jsonb) as more
    from r
    join profile p0 on p0.id = r.few[1]
   order by r.at desc
   limit lim
$$;

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
-- same signed-in-readable tables the timeline already walks, and post's own read
-- policy is what decides that a taken-down post is nobody's business.
--
-- WHAT IS NOT HERE, and both are deliberate:
--
--   Nothing. Both of the halves that were open on 2026-08-28 have been
--   answered and are in: the list stands still between ticks (feed_hot()
--   below, and the note inside it), and the blue mark is worth four
--   (feed_paid_weight()), multiplied onto whoever badge_of() says wears it
--   (feed_weight()).
--
-- `off` and not a timestamp for the continuation: this list is ordered by a
-- score, and a score is not something you can ask for "the ones after". A
-- count is honest about being a count.
-- ---------------------------------------------------------------------------

-- The tick the list turns on. 「4時間ごと。0 4 8 12 16 20 24 これは入れ替わら
-- ない。」 OWNER 2026-08-28 -- so this answers the most recent of those six
-- hours and never anything in between.
--
-- IN AMERICAN TIME, and the zone is the day's sentence's own.
-- 「3はアメリカ時間ね」「時間もお題のページに合わせるってこと」 OWNER
-- 2026-08-28 -- two sentences that point at the same place.
--
-- IT WAS UTC, and that followed NEITHER of them. The argument written here
-- was that the day's page does no zone arithmetic, because netDay() asks for
-- the newest row rather than today's. That is true of the PHONE and it is not
-- where the boundary is decided: supabase/functions/daily-prompt/index.ts
-- picks `on_day` with `timeZone: 'America/Los_Angeles'`, and the cron that
-- runs it is set in Pacific (supabase/setup.md). So the day already turns in
-- California, and the list was turning in UTC beside it -- 0 4 8 12 16 20 in
-- American local time only while the offset happens to be a multiple of four.
--
-- Naming the zone here is not a second copy of a timezone rule: it is the
-- same one, read from the same place the day is read from. The phone still
-- does no arithmetic at all.
create or replace function feed_slot()
returns timestamptz language sql stable as $$
  select (date_trunc('hour', now() at time zone 'America/Los_Angeles')
          - make_interval(hours =>
              (extract(hour from now() at time zone 'America/Los_Angeles')::int % 4)))
         at time zone 'America/Los_Angeles'
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
-- badge_of(), and nothing else. 「青パッチ＝課金した人の印」 and 「青パッチの
-- 倍率」 (docs/FEATURE_RULES.md § 2026-08-28) put the four ON THE MARK, so the
-- account that wears it on a post is the account whose posts are multiplied --
-- one answer to 「who wears it」, read by the timeline and by this ordering
-- alike. Whether a rung that does not wear the mark is multiplied as well has
-- not been decided, so it is not.
create or replace function feed_weight(who uuid)
returns numeric language sql stable as $$
  select case when badge_of(who) then feed_paid_weight() else 1::numeric end
$$;

-- Dropped by name first, because the return type gains columns below and
-- `create or replace function` refuses to change one. This file is pasted
-- over a database that already has the old shape.
drop function if exists feed_hot(int, int);
create or replace function feed_hot(lim int default 50, off int default 0)
returns table (id uuid, author uuid, language uuid, prompt bigint,
               reply_to uuid, created_at timestamptz, hidden_at timestamptz,
               author_out boolean, body jsonb,
               -- The same five post_seen grew, in the same order. The comment
               -- further up says this function is 「Read as post_seen reads,
               -- column for column」 and netRow() in www/net.js is why: one
               -- function on the phone turns a row from EITHER list into a
               -- post, so a column added to one is a column added to both.
               likes bigint, boosts bigint, replies bigint,
               i_like boolean, i_boost boolean,
               -- and what it quotes, as post_seen has it (r94)
               quote_of uuid, quoted jsonb,
               -- and whether the author wears the mark (post_seen.badge)
               badge boolean)
language sql stable as $$
  select v.id, v.author, v.language, v.prompt, v.reply_to, v.created_at,
         v.hidden_at, v.author_out, v.body,
         v.likes, v.boosts, v.replies, v.i_like, v.i_boost,
         v.quote_of, v.quoted, v.badge
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
         and not post_private(q.body)
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
     /* AND NOT A REPLY. 「おすすめにリプライ出てくるのやめよう」 OWNER
        2026-09-08. This list is the one nobody asked to be on -- 「リプライは
        おすすめ並ぶことないでしょ？基本」 OWNER 2026-09-04 -- and it was said
        on the PHONE (snsList() in www/sns.js) and nowhere here. A phone that
        asks for fifty and then hides the answers is a phone showing a page
        of thirty: the filtering is not wrong, it is in the wrong place, and
        what it costs is the length of the page.

        It is left out of the RESULT and not out of the scoring: `a.pts`
        above counts the replies TO a post, which is most of what makes a
        post go round, and that is unchanged.

        The other two lists are untouched. 「フォロー中」 is the people
        somebody chose to read and a thread is theirs to say; feed_fo() below
        keeps them, and so does the day's list. */
     and v.reply_to is null
     -- and nobody the reader has muted (post_seen.muted)
     and not v.muted
   order by ((k.pts + a.pts) * feed_weight(v.author)) desc, v.created_at desc
   limit lim offset off
$$;

-- THE PEOPLE YOU FOLLOW, AND WHAT THEY PASSED ON.
--
-- 「当たり前だけどsnsとして機能してない」 OWNER 2026-09-01.
--
-- The followed timeline was `author=in.(the people you follow)` -- posts they
-- WROTE, and nothing else. A boost is a row in `react`, not a post, so
-- **boosting did nothing to anybody's timeline**: the row went in, the count
-- (once post_seen carried one) went up, and the post it pointed at was seen
-- by nobody who was not already going to see it. That is not a boost; it is a
-- private bookmark with a number on it.
--
-- Two questions in one because they are one list: what they wrote, and what
-- they passed on, in the order the reader's day happened.
--
--   `by`      who passed it on, or null when they wrote it. A reader has to
--             be told which of the two this is -- 「Aさんがリポスト」 is the
--             whole difference between a post and a boost on a timeline, and
--             a row that did not say would be the app deciding it did not
--             matter
--   `by_name`, `by_hd`  that person's display name and handle as they are
--             NOW, from `profile` -- 「〇〇がリポスト」 under the author's name
--             (OWNER 2026-09-26) is drawn off the row, and a uuid is not a
--             name. Null when `by` is
--   `at_key`  what to sort and page by: WHEN IT REACHED YOU. For a boost that
--             is when it was boosted, not when it was written -- a five year
--             old post passed on this morning belongs at this morning, and
--             sorting by created_at would file it in a place nobody will ever
--             scroll to
--
-- `distinct on (id)` because following both the author and somebody who
-- boosted them is ordinary, and the same post twice in one screen is not two
-- pieces of news. The most recent arrival wins, which is what the reader is
-- being told about.
--
-- Hidden posts are left out on BOTH sides. A boost of something taken down is
-- not a way back to it.
-- Dropped by name first, as feed_hot() is: its return type gained the quote's
-- two columns (r94) and `create or replace function` refuses to change one.
drop function if exists feed_fo(int, timestamptz);
create or replace function feed_fo(lim int default 50,
                                   before timestamptz default null)
returns table (id uuid, author uuid, language uuid, prompt bigint,
               reply_to uuid, created_at timestamptz, hidden_at timestamptz,
               author_out boolean, body jsonb,
               likes bigint, boosts bigint, replies bigint,
               i_like boolean, i_boost boolean,
               quote_of uuid, quoted jsonb, badge boolean,
               by uuid, by_name text, by_hd text, at_key timestamptz)
language sql stable as $$
  select z.id, z.author, z.language, z.prompt, z.reply_to, z.created_at,
         z.hidden_at, z.author_out, z.body,
         z.likes, z.boosts, z.replies, z.i_like, z.i_boost,
         z.quote_of, z.quoted, z.badge,
         z.by, bp.display, bp.handle, z.at_key
    from (
      select distinct on (q.id) q.*
        from (
          select v.*, null::uuid as by, v.created_at as at_key
            from post_seen v
           where v.hidden_at is null
             and not v.muted
             and v.author in (select f.followed from follow f
                               where f.follower = auth.uid())
             and (before is null or v.created_at < before)
          union all
          select v.*, r.actor as by, r.created_at as at_key
            from react r join post_seen v on v.id = r.post
           where r.kind = 'boost'
             and v.hidden_at is null
             -- a muted person's post is not handed on by somebody else either
             and not v.muted
             -- post_seen has already asked about who WROTE it; who passed it
             -- on is a second person on the row and is asked here -- blocked,
             -- and muted: 「その人がリポストした投稿も出さない」 OWNER
             -- 2026-09-25, whoever wrote the post.
             and not block_hides(r.actor)
             and not mute_hides(r.actor)
             and r.actor in (select f.followed from follow f
                              where f.follower = auth.uid())
             and (before is null or r.created_at < before)
        ) q
       order by q.id, q.at_key desc
    ) z
    left join profile bp on bp.id = z.by
   order by z.at_key desc
   limit lim
$$;

-- ONE PERSON'S PAGE: WHAT THEY WROTE AND WHAT THEY PASSED ON.
--
-- 「リツイートとか引用したやつって自分の投稿に載らないのはなぜ？」 OWNER
-- 2026-09-26 -- X's shape: a person's page carries their reposts among their
-- posts, dated by when they reposted. It is feed_fo() above with the follow
-- list replaced by one person, and the columns are feed_fo()'s column for
-- column, so netRow() reads a row from either list the one way.
--
-- What they WROTE is post_seen as it stands, and not muted-filtered: a mute
-- is not 「see nothing of them」, and their own page still shows what they
-- wrote (§ mute_hides). A block and a post kept to yourself are post_seen's
-- own `where`.
--
-- What they PASSED ON is feed_fo()'s boost branch, the same sentence: not a
-- taken-down post, not a post by somebody the reader muted, and not when the
-- one who passed it on is behind a block or a mute of the reader's.
--
-- `who` has no default, so the block walk in tools/rls-check.mjs (which
-- calls what takes no argument) does not reach this; its cases do.
drop function if exists posts_by(uuid, int, timestamptz);
create or replace function posts_by(who uuid, lim int default 50,
                                    before timestamptz default null)
returns table (id uuid, author uuid, language uuid, prompt bigint,
               reply_to uuid, created_at timestamptz, hidden_at timestamptz,
               author_out boolean, body jsonb,
               likes bigint, boosts bigint, replies bigint,
               i_like boolean, i_boost boolean,
               quote_of uuid, quoted jsonb, badge boolean,
               by uuid, by_name text, by_hd text, at_key timestamptz)
language sql stable as $$
  select z.id, z.author, z.language, z.prompt, z.reply_to, z.created_at,
         z.hidden_at, z.author_out, z.body,
         z.likes, z.boosts, z.replies, z.i_like, z.i_boost,
         z.quote_of, z.quoted, z.badge,
         z.by, bp.display, bp.handle, z.at_key
    from (
      select distinct on (q.id) q.*
        from (
          select v.*, null::uuid as by, v.created_at as at_key
            from post_seen v
           where v.author = who
             and (before is null or v.created_at < before)
          union all
          select v.*, r.actor as by, r.created_at as at_key
            from react r join post_seen v on v.id = r.post
           where r.kind = 'boost'
             and r.actor = who
             and v.hidden_at is null
             and not v.muted
             and not block_hides(r.actor)
             and not mute_hides(r.actor)
             and (before is null or r.created_at < before)
        ) q
       order by q.id, q.at_key desc
    ) z
    left join profile bp on bp.id = z.by
   order by z.at_key desc
   limit lim
$$;

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

-- ---------------------------------------------------------------------------
-- Whether an address already has an account
--
-- 「アカウントのあるアドレスで新規作成はいらんやろ。このアカウントは登録されて
-- いますの赤文字で。アカウントを作るページなんだけど？」 OWNER 2026-09-03,
-- and the other half the same minute: a reset asked for an address that has no
-- account walks on to a screen waiting for six digits that will never be sent.
--
-- SUPABASE WILL NOT ANSWER THIS AND THAT IS ON PURPOSE. /auth/v1/otp and
-- /auth/v1/recover both answer 200 whether or not the address is known, so
-- that nobody can stand outside and ask which addresses are registered. So the
-- door had no way to tell, and both screens walked on regardless.
--
-- This is that answer, deliberately: **the owner has decided the two screens
-- say which it is, and saying so is telling anybody who asks.** It is the
-- ordinary trade every app with a 「that address is taken」 message has made.
-- What is bounded is how much it tells: a boolean, one address at a time,
-- and no way to list. The rate limit on `emails` does not cover it, so if
-- this ever needs slowing down it is a limit of its own.
--
-- `security definer` because auth.users is not readable by anon, and `stable`
-- because it writes nothing. Lower-cased and trimmed on both sides: Supabase
-- stores the address as typed, and 「A@b.c」 and 「a@b.c」 are one account.
-- ---------------------------------------------------------------------------
create or replace function email_taken(p text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from auth.users
     where lower(email) = lower(btrim(p))
  );
$$;

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

-- The other direction, which is why hiding is not deleting.
create or replace function post_show(p uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not staff'; end if;
  update post set hidden_at = null, hidden_why = null where id = p;
end $$;

-- And the third answer, which is that there was nothing wrong.
-- 「通報で問題なかったらその通報が消せるようにしてほしい」 OWNER 2026-09-05.
-- The post stays exactly as it is and the account stays exactly as it is --
-- what goes is the row asking somebody to look, because it has been looked at.
--
-- A function rather than a delete policy for the reason the two above are:
-- report_read is is_staff() and a delete policy would be a second place saying
-- who may act on a report.
-- `bigint`, because that is what report.id IS -- the table is `generated always
-- as identity` where post and profile are uuid, so the pair of them do not
-- take the same kind of name however alike they read.
create or replace function report_drop(r bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not staff'; end if;
  delete from report where id = r;
end $$;

-- And the same for something somebody wrote in. 「運営は消せるように。」 OWNER
-- 2026-09-22, said about exactly this and nothing else.
--
-- A function and not a delete policy, for the reason report_drop() is one: a
-- policy would be a door on the table, and what may go through it would then
-- be 「rows is_staff() can see」 -- which is every row. The function is the one
-- road, is_staff() is asked inside it, and the app is a suggestion.
--
-- Nothing else changed: there is still no update policy and no update here.
-- Reading a complaint and rewriting it is not an act anybody asked for.
create or replace function feedback_drop(f bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not staff'; end if;
  delete from feedback where id = f;
end $$;

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

create or replace function account_unban(p uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not staff'; end if;
  update profile set banned_at = null, banned_why = null where id = p;
end $$;

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

-- ---------------------------------------------------------------------------
-- Putting somebody's language back
--
-- 「運営が治せる仕様は欲しい。ユーザーが問い合わせてきた時に、アカウントの
-- 復旧ができるようにしたい、管理画面で」 OWNER 2026-09-09.
--
-- Two functions, and they are the whole of the road: one says what versions
-- there are, one puts a version back. `security definer` for the reason
-- post_hide() is -- the caller is a normal account whose own policies do not
-- let it read somebody else's slice_hist -- and is_staff() is asked inside,
-- so the definer rights are not a way in.
--
-- STAFF, AND NOT ONLY THE ONE ABOVE THEM, on purpose. admin_counts() above
-- asks is_admin() and these two ask is_staff(), all three from the same
-- screen, and the owner was asked whether that was meant: 「それでいいよ」 --
-- the counts are @lingua's alone, looking back and putting back is any
-- staff's (docs/FEATURE_RULES.md 2026-09-23).
--
-- NO BODY EVER COMES BACK. A version of a 5000-word dictionary is 685 KB, and
-- the screen shows a date, never its contents: the operator is restoring on
-- the person's word, not reading their language. So the list carries
-- (language, v, at) and admin_restore_lang() is told which version to put back.
--
-- A LANGUAGE'S VERSIONS ARE ITS SAVES, THE THREE NEWEST.
-- 「言語を前に戻す →『3つ前、まるごと』」 OWNER 2026-09-24. A version is named by
-- its save's number, or by its time where it carries none (see `press` above),
-- and it is dated by when that save landed. Three and no more: the history
-- keeps three rows per kind, and one save moves a kind once, so the three
-- newest saves are the three every kind can still answer for -- a fourth
-- would be put back out of rows the ceiling has already dropped.
--
-- Security INVOKER, so called directly it reads slice_hist as the caller --
-- which is nobody but staff (slice_hist_read); the two below are definer and
-- ask is_staff() first.
create or replace function slice_versions(lang uuid)
returns table(v text, at timestamptz)
language sql stable set search_path = public as $$
  select coalesce(h.press::text, 'at:' || h.at::text) as v, max(h.at) as at
    from slice_hist h
   where h.language = lang
   group by 1
   order by 2 desc
   limit 3
$$;

create or replace function admin_hist(handle text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare who uuid; out jsonb;
begin
  if not is_staff() then raise exception 'not staff'; end if;
  select id into who from profile p where p.handle = admin_hist.handle;
  if who is null then return jsonb_build_object('who', null); end if;
  select jsonb_build_object(
    'who',   who,
    'langs', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name)
                                        order by l.created_at)
                         from language l where l.owner = who), '[]'::jsonb),
    'hist',  coalesce((select jsonb_agg(jsonb_build_object(
                                'language', l.id, 'v', sv.v, 'at', sv.at)
                                        order by sv.at desc)
                         from language l, lateral slice_versions(l.id) sv
                        where l.owner = who), '[]'::jsonb)
  ) into out;
  return out;
end $$;

-- AND PUTTING ONE BACK IS THE WHOLE LANGUAGE, IN ONE SAVE OF ITS OWN.
-- For every kind: the first version kept at or after the moment that save
-- landed is what the kind was just before it; a kind with none has not moved
-- since, and is left as it is. A kind that did not exist yet is not taken
-- away -- nothing here deletes. The writes carry one new number, so what
-- was there a moment ago becomes ONE version, and the operator can walk the
-- restore back the same way. A version outside the three newest names
-- nothing and restores nothing, and says so.
create or replace function admin_restore_lang(language uuid, v text)
returns void
language plpgsql security definer set search_path = public as $$
declare t timestamptz; r uuid := gen_random_uuid(); k text; b text;
begin
  if not is_staff() then raise exception 'not staff'; end if;
  if not exists (select 1 from slice_versions(admin_restore_lang.language) s
                  where s.v = admin_restore_lang.v)
  then raise exception 'no such version'; end if;
  select min(h.at) into t from slice_hist h
   where h.language = admin_restore_lang.language
     and coalesce(h.press::text, 'at:' || h.at::text) = admin_restore_lang.v;
  for k in select distinct h.kind from slice_hist h
            where h.language = admin_restore_lang.language and h.at >= t
  loop
    select h.body into b from slice_hist h
     where h.language = admin_restore_lang.language and h.kind = k and h.at >= t
     order by h.at asc limit 1;
    update slice s set body = b, at = now(), press = r
     where s.language = admin_restore_lang.language and s.kind = k;
    if not found then
      insert into slice(language, kind, body, at, press)
           values (admin_restore_lang.language, k, b, now(), r);
    end if;
  end loop;
end $$;
-- One kind at a time is gone: a language put back a part at a time is one no
-- save ever made -- the words from Tuesday under Friday's letters.
drop function if exists admin_restore(uuid, text, timestamptz);

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
  -- `staff` only. Who is above staff is the handle itself now (is_admin()
  -- above), so there is no flag to raise for it.
  if profile_admin(new) then
    new.staff := true;
  end if;
  return new;
end $$;
drop trigger if exists profile_first on profile;
create trigger profile_first before insert on profile
  for each row execute function profile_first();

-- AND THE NAME CANNOT BE MOVED ONTO OR OFF THE ONE ABOVE STAFF.
--
-- is_admin() asks the handle, and `handle` IS in the UPDATE grant below --
-- somebody renames themselves on the profile screen, which is what that grant
-- is for. Uniqueness stops a second `lingua` while the first exists, and that
-- is the whole of what stopped it: the row going away for a moment, or the
-- owner renaming themselves, would leave the name free to be taken by whoever
-- asked next. A unique index is a rule about two rows, not about who may be
-- called what.
--
-- Both directions, and the second is the one that costs something to get
-- wrong: an owner who renames themselves is an owner with no screen left to
-- fix it from -- staff_drop() carries the same sentence three functions down.
--
-- AND IT CANNOT BE MOVED TWICE IN A FORTNIGHT. 「ユーザーネームは14日に1度しか
-- 変更できないようにしたい」 OWNER 2026-09-03. It is the same trigger and not a
-- second one: both sentences are about the same act -- this handle becoming
-- that handle -- and two triggers on one act are two places to read before
-- anybody knows what a rename does.
--
-- HERE AND NOT ON THE PHONE. www/me.js can grey the field out and it should,
-- but a screen is a suggestion: `handle` is in the UPDATE grant below, so
-- PATCH /rest/v1/profile with a new one is a request anybody can make with the
-- app closed. This is the only place that is not a suggestion.
--
-- The order of the three is the claim. The reserved name is asked FIRST and on
-- its own, so that no window opened underneath it -- an account fourteen days
-- clear, an account that has never renamed -- can ever be the reason a rename
-- onto or off @lingua got through. The fortnight is the narrower rule and it
-- goes second; if it ever comes out, the name is still held.
create or replace function profile_rename() returns trigger
language plpgsql set search_path = public as $$
begin
  -- `before update of handle` fires on the column being SET, which is not the
  -- same as the name having moved. A screen that writes the row back with the
  -- handle it already had would otherwise spend somebody's fortnight on
  -- nothing, and they would find out fourteen days later.
  if new.handle is not distinct from old.handle then
    return new;
  end if;
  -- Both directions in one sentence: with the line above holding, "one of the
  -- two is lingua" IS "onto it or off it".
  if profile_admin(new) or profile_admin(old) then
    raise exception 'handle reserved';
  end if;
  if old.handle_at is not null
     and old.handle_at > now() - interval '14 days' then
    raise exception 'handle too soon';
  end if;
  new.handle_at := now();
  return new;
end $$;
drop trigger if exists profile_rename on profile;
create trigger profile_rename before update of handle on profile
  for each row execute function profile_rename();

-- ---------------------------------------------------------------------------
-- Whoever is staff is Pro, and stays Pro
--
-- 「管理の画面でスタッフ設定を@でできるでしょ？そこに記載されてる人だけずっと
-- プロに」 OWNER 2026-09-05. The staff screen is the whole of the list: being
-- on it IS being Pro, and there is no second place that says so.
--
-- Here and not in www/, because www/ is a suggestion. There is no road into
-- this table from a phone any more, but the service role has one and the
-- dashboard has one, and neither of those is a screen either. So the tier is
-- held where the row is written rather than where it is drawn, and it holds
-- against every road at once.
--
-- Two triggers because there are two moments, and they are one mechanism seen
-- from each end: a plan row being WRITTEN for somebody who is already staff,
-- and somebody BECOMING staff when the row is already there. Neither can be
-- the other's job -- the first fires on the plan table and the second on
-- profile.
--
-- Taking staff away does NOT take Pro away. What that account should then be
-- paying is a decision and is nobody's to make from here; the row is left
-- exactly as it is. → docs/FEATURE_RULES.md § Deciding.
--
-- AND A ROW HELD UP HERE NEVER ENDED, so the two columns that say one did are
-- cleared in the same breath. 「スタッフは消えないんじゃねえの？」 OWNER
-- 2026-09-12, on a phone that had just been updated.
--
-- `verify-plan` decides a rung from the `purchase` rows and nothing else, and
-- a staff account has no purchase: it writes 'free' with `was` set to whatever
-- the row said before, which for staff is 'pro'. The plan is put back here --
-- that half has held since 2026-09-05 -- and without this the row would come
-- out Pro with 「プランが終了しました」 written on it, so every staff launch
-- would be told their subscription had ended. Nothing throws; it is a popup
-- over a Pro account.
--
-- It is here and not in the function for the reason the whole trigger is here:
-- 「staff はずっと Pro」 is one sentence and this is the one place it is said.
-- A staff test inside verify-plan would be a second place, and the second
-- place is the one that gets forgotten when a third road into this table
-- arrives (the dashboard already is one).
--
-- Only when it is actually overriding, which is why the plan is compared
-- first: `plan_lapse_seen()` updates a staff row that is already Pro -- it
-- writes `lapse_seen_at` and nothing else -- and a clear on every write would
-- undo it.
create or replace function plan_staff_hold() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from profile where id = new.id and staff)
     and new.plan <> 'pro' then
    new.plan := 'pro';
    new.was := null;
    new.lapse_seen_at := null;
  end if;
  return new;
end $$;
drop trigger if exists plan_staff_hold on plan;
create trigger plan_staff_hold before insert or update on plan
  for each row execute function plan_staff_hold();

-- And the other end. `of staff` narrows the UPDATE to the column being set,
-- the way profile_rename() is narrowed; on INSERT that clause says nothing, so
-- `when (new.staff)` is what carries both -- and a profile that arrives
-- already staff is the dashboard's road, which is the road the decision is
-- about.
create or replace function profile_staff_plan() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into plan(id, plan, at) values (new.id, 'pro', now())
    on conflict (id) do update set plan = 'pro', at = now();
  return null;
end $$;
drop trigger if exists profile_staff_plan on profile;
create trigger profile_staff_plan after insert or update of staff on profile
  for each row when (new.staff) execute function profile_staff_plan();

update profile p set staff = true where profile_admin(p);

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
--
-- A HANDLE NOBODY HAS IS AN ERROR AND NOT A SILENCE. 「何も出ない。勝手に＠の
-- 中が消える。追加されてない」 OWNER 2026-09-05. `update ... where handle = h`
-- matching no row is a successful statement: the function returned, the app
-- took the success road, emptied the field and reloaded a list that had not
-- changed -- so a handle that does not exist looked exactly like one that had
-- just been added. `if not found` is the whole of the difference; the app has
-- a sentence to show for it (net.nohandle in www/i18n).
--
-- And the match is `lower()` on both sides, in this one place. `handle` is
-- lower case by the check constraint at the top of this file, so this changes
-- no row that could ever have matched -- what it does is let somebody type a
-- capital. netHandleOf() in www/net.js already lowers what the screen sends;
-- this function is reachable without that screen, and a rule the caller is
-- trusted to have applied is a rule nothing holds.
create or replace function staff_add(h text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update profile set staff = true where lower(handle) = lower(h);
  if not found then raise exception 'no such handle'; end if;
end $$;

-- And taking it off is the same function the other way, in the same shape:
-- the same match, and a handle nobody has is an error and not a silence. It
-- matched `handle = h` exactly and said nothing when nothing matched, so
-- `staff_drop('AYA')` returned and aya stayed staff (r63-audit SQ3, measured).
--
-- THE ONE ABOVE STAFF CANNOT BE TAKEN OFF IT, and says so. It is the one
-- failure here that cannot be undone from inside the app: an owner who is no
-- longer the owner has no screen left to fix it from. The row does not move
-- either way; what the refusal adds is that the caller is told, which is the
-- sentence `staff_add()` above is written after.
create or replace function staff_drop(h text)
returns void
language plpgsql security definer set search_path = public as $$
declare r profile;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  select * into r from profile where lower(handle) = lower(h);
  if not found then raise exception 'no such handle'; end if;
  if profile_admin(r) then raise exception 'the one above staff stays staff'; end if;
  update profile set staff = false where id = r.id;
end $$;

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
  select p.id into l from profile p where profile_admin(p);
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
--
-- `prefs` IS ON THIS LINE AND WAS NOT, FOR A FORTNIGHT. The column was added
-- on 2026-09-08 -- 「端末に残すものないんですけど。サーバーで同じ機能になるよう
-- に代替して」 -- and this grant was not touched, so `netPrefsPut()` in
-- www/net.js sent `PATCH /rest/v1/profile {prefs:...}` and the database
-- refused it, every time, for everybody. Nothing threw: that call's failure
-- handler is `function(){}`, so the theme and the interface language went on
-- working out of the copy on the handset and simply never arrived anywhere.
-- Exactly the thing the paragraph above says this line is for -- 「a column
-- added later is not updatable until it is added to one of these lines」 --
-- happening to the column added the day after it was written.
--
-- It is not a preference any more either: the switches that say which
-- notices reach a phone are fields of this column (2026-09-22), and a switch
-- that cannot be written is a switch that is always on.
revoke update on profile from authenticated;
grant  update (handle, display, av, bio, link, loc, prefs, ed) on profile to authenticated;

-- And the same sentence about INSERT, which is not the same statement.
--
-- The paragraph above says "each is one UPDATE with one extra field in it",
-- and that was the whole of it for as long as the row already existed when
-- somebody reached for it. A profile does not: `profile_make` is how an
-- account writes ITSELF into existence, so the first write of the row is an
-- INSERT the account controls, and `insert into profile(id,handle,staff)
-- values (me,'x',true)` was one extra field in exactly the same way. Column
-- privileges for INSERT are a separate grant from the ones for UPDATE, so
-- revoking UPDATE said nothing about it: anybody who had not made their
-- profile yet could arrive holding staff, which opens post_hide(),
-- account_ban() and the report queue behind them.
--
-- The five named are what netMakeProfile() in www/net.js sends. staff,
-- banned_at and banned_why are the server's, and the only thing that writes
-- staff is profile_first() -- a BEFORE trigger, which assigns to NEW rather
-- than naming a column in the statement, so it is not what this grant is
-- about and @lingua still arrives holding it.
--
-- `handle` IS in the UPDATE grant, and with is_admin() reading the handle
-- that is the road somebody would take. profile_rename() closes it.
revoke insert on profile from authenticated;
grant  insert (id, handle, display, av, bio, link, loc) on profile to authenticated;

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
revoke update on post from authenticated;
grant  update (body, language, prompt, reply_to) on post to authenticated;

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
revoke insert on post from authenticated;
grant  insert (id, author, language, body, prompt, reply_to, quote_of) on post to authenticated;

-- ---------------------------------------------------------------------------
-- And the road OUT: a trigger on each table whose insert is a notice
--
-- 「通知作ろう。アップルのネイティブ通知で、フォローされた時、返信きた時みたい
--   な感じでSNS部分であるやつ。」 OWNER 2026-09-22.
-- 「通知なんだけど、今日のお題が変わった時にも出るようにできる？」
-- 「時間が決まってるでしょ。アメリカ時間の0時。それに合わせるのは？」
--   OWNER 2026-09-23.
--
-- WHAT THE KINDS ARE IS NOT SAID HERE. It is `PUSH` in
-- supabase/functions/push-send/push.mjs -- one entry per kind, saying which
-- table's insert raises it, how its row is read back, and who it is for.
-- These triggers only knock: each hands push-send the table and the row, and
-- push-send asks that entry what it is. `follow`, `reply`, `like` and `boost`
-- are the four `notices()` returns (`react.kind` tells the last two apart
-- there and there), and `prompt` is the day's sentence, which is for
-- everybody and is not a notice in the tab. tools/rls-check.mjs reads every
-- `table` out of `PUSH` and fails on one with no trigger here, so a kind
-- added tomorrow is an entry there and a line below, and the second is
-- counted rather than remembered.
--
-- THE TRIGGER CARRIES WHOEVER WROTE THE ROW, AND NOTHING ELSE.
-- 「サインインなしで勧めるものないけど」 OWNER 2026-09-22 -- there is nothing
-- in this app that proceeds without a sign-in, and this road is not to be the
-- first. A trigger fires INSIDE the REST request of the person who wrote the
-- row, so that person's own `Authorization` is right there in
-- `request.headers`, and `push_ping()` hands it on unchanged. push-send is
-- deployed WITH JWT verification, so a call carrying no signature is refused
-- before a line of it runs, and push.mjs then refuses one whose uid is not
-- the row's own actor -- being signed in as somebody is not the same as
-- having done the thing.
--
-- No secret is written down here and none could be: what travels is the
-- caller's own token, which they already hold, and it is read at the moment
-- of the write rather than stored.
--
-- THE DAY'S PROMPT IS THE SAME ROAD. Its row is written by
-- supabase/functions/daily-prompt with the service role key, through
-- PostgREST like every other write, so that key is what is in
-- `request.headers` and what push_ping() hands on. push-send rings EVERYBODY
-- for that kind and nobody else can make it: the entry says its actor is the
-- service role, and a signed-in person's token is not that key. `prompt` has
-- no insert policy and no insert grant for anybody the app signs in as
-- (the prompt_read policy above, the cover at the foot), so no request from
-- a phone can reach this trigger at all -- tools/rls-check.mjs tries, as B
-- and as anon, and watches the queue stay empty.
--
-- WHY THIS IS OUR OWN FUNCTION AND NOT `supabase_functions.http_request()`.
-- That is the packaged one a Database Webhook uses, and its headers are
-- **arguments of the trigger**, which PostgreSQL fixes as string constants
-- when the trigger is created: `create trigger ... execute function f(<any
-- expression>)` is a syntax error, measured 2026-09-22. So the packaged road
-- can carry a header somebody wrote down in this file and no other -- which
-- is either a secret in the schema or an open door, and the owner has ruled
-- out the door. `net.http_post` is what that function hands to anyway
-- (pg_net), it arrives with the same one dashboard click, and it takes its
-- headers as a value. One mechanism, one hop fewer.
--
-- IT MUST NOT BE ABLE TO STOP THE WRITE. `net.http_post` queues the request
-- and returns; the POST happens after the transaction. A notification that
-- cannot be sent must never cost somebody the follow, the reply or the like
-- they actually made. Anything unexpected is swallowed for the same reason
-- and the write stands.
--
-- AFTER INSERT AND NOTHING ELSE. A row that already exists has already been
-- notified about, so nothing here ever fires for the past -- which is the
-- whole answer to 「前からある data」 for this feature. No update trigger:
-- un-liking and re-liking is a delete and an insert, and the insert is the
-- notice.
--
-- WHY THE `do` BLOCK, and why it is guarded. `net` is not part
-- of PostgreSQL and is not part of this file: pg_net arrives when somebody
-- turns Database -> Webhooks on in the dashboard, once
-- (supabase/setup.md § 12). Named unconditionally, a paste into a project
-- where that click has not happened yet stops HERE -- and on 2026-09-15 a
-- paste that stopped part-way left NOTHING behind it: no `profile.link`, no
-- `plan.was`, an app store rejection and every phone reading free. That is
-- the failure this guard exists to prevent, and it is why this block is the
-- LAST thing in the file as well: everything above it has landed by the time
-- it is reached.
--
-- A skipped block is not a silent one. It says so, and setup.md § 12 says to
-- look for it -- 「空」と「壊れている」は別の状態, which is the first page of
-- CLAUDE.md. What holds the triggers themselves is tools/rls-check.mjs,
-- which applies this file once WITHOUT pg_net (and asks that the rest of it
-- still landed) and once WITH it (and asks that every table `PUSH` names has
-- one, and that what goes down the road carries the writer's own
-- Authorization).

-- AND A ROW RINGS ONCE. push-send asked who was knocking and whether they
-- were the row's own actor, and nothing about whether that row had rung
-- already -- so B could point at B's own follow of A and ring A's phone as
-- often as B liked (r63-audit SQ2). The record is ON THE ROW, `rung_at`, for
-- two reasons: it goes when the row goes (an account deleted leaves no record
-- of who was rung about it), and a follow undone and made again is a new row,
-- which rings the way it always has.
--
-- push_once() is the one thing that writes it, and it answers whether THIS
-- call is the one that did -- true once per row, false after. `k` is the
-- row's key as push.mjs reads it (`PUSH[].key`); the table and the column
-- names go through format('%I'), so what the caller sends is never SQL.
--
-- Security invoker, and that is who may call it: none of these tables has an
-- update policy that reaches this column (react, follow and prompt have none
-- at all, and `post`'s column grant does not carry it), so the service role
-- -- which row level security does not apply to -- is the one caller whose
-- mark lands. A signed-in caller gets false or a refusal and marks nothing.
-- tools/rls-check.mjs asks every table `PUSH` names for the column.
alter table follow add column if not exists rung_at timestamptz;
alter table post   add column if not exists rung_at timestamptz;
alter table react  add column if not exists rung_at timestamptz;
alter table prompt add column if not exists rung_at timestamptz;

create or replace function push_once(tbl text, k jsonb) returns boolean
language plpgsql as $$
declare w text := ''; f text; n int;
begin
  for f in select jsonb_object_keys(k) loop
    w := w || format(' and %I = %L', f, k ->> f);
  end loop;
  if w = '' then return false; end if;
  execute format('update %I set rung_at = now() where rung_at is null', tbl) || w;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- The one place a write becomes a knock on push-send's door.
--
-- `security definer` because `net.http_request_queue` is not a table the app's
-- roles may write, and the person inserting a follow is the app's role. What
-- it is allowed to do with that power is this function's whole body: read one
-- header, and queue one POST.
--
-- NO SIGNATURE, NO KNOCK. `request.headers` is set by PostgREST for the
-- request this write is part of; a write that did not come through it -- the
-- service role, a dashboard query, a migration -- has none, and there is
-- nobody to send as. That is a state, not an error: the row is written and no
-- notice goes out.
create or replace function push_ping() returns trigger
language plpgsql security definer set search_path = public as $f$
declare
  auth text;
begin
  begin
    auth := nullif(current_setting('request.headers', true), '')::json ->> 'authorization';
  exception when others then
    auth := null;
  end;
  if auth is null or auth = '' then return null; end if;

  begin
    perform net.http_post(
      url     := 'https://iimwukyyasbybfrirhsf.supabase.co/functions/v1/push-send',
      body    := jsonb_build_object('table', TG_TABLE_NAME, 'record', to_jsonb(NEW)),
      headers := jsonb_build_object('Content-Type', 'application/json',
                                    'Authorization', auth),
      timeout_milliseconds := 5000);
  exception when others then
    /* 通知が出ないことが、フォローや返信やいいねを落としてはいけません。 */
    null;
  end;
  return null;
end
$f$;

do $b$
begin
  if not exists (select 1 from pg_proc p
                   join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'net' and p.proname = 'http_post') then
    raise notice '%', 'push-send: Database -> Webhooks has not been turned on '
      'for this project, so the notification triggers were NOT made. '
      'Everything else in this file is in. See supabase/setup.md section 12, '
      'then run this file again.';
    return;
  end if;

  drop trigger if exists push_on_follow on follow;
  create trigger push_on_follow after insert on follow
    for each row execute function push_ping();

  -- Only the ones that answer something or quote something (r94). A post
  -- that does neither is not a notice for anybody, and a trigger that fired
  -- for every post would put the whole timeline through this road to be
  -- thrown away at the far end. ONE trigger for both, the way `react` has one
  -- for like and boost: which of the two a row is, is push-send's `PUSH` to
  -- say (the key carries `reply_to` or `quote_of`), and a second trigger here
  -- would be that fact written down twice. `push_on_reply` was its name while
  -- a reply was all it rang for, and is dropped on a server that has it.
  drop trigger if exists push_on_reply on post;
  drop trigger if exists push_on_post on post;
  create trigger push_on_post after insert on post
    -- A post kept to yourself rings nobody: the person answered or quoted
    -- cannot read it, so telling them it exists is reading it (post_private).
    for each row when ((new.reply_to is not null or new.quote_of is not null)
                       and not post_private(new.body))
    execute function push_ping();

  -- Both kinds down one trigger. `react.kind` is where like and boost are
  -- told apart and it is told apart there for notices() as well; a second
  -- trigger per kind would be that one fact written down twice.
  drop trigger if exists push_on_react on react;
  create trigger push_on_react after insert on react
    for each row execute function push_ping();

  -- The day's prompt, for everybody. After insert only: daily-prompt writes
  -- a day's row once and does nothing when it is there, and somebody fixing
  -- the sentence in the Table Editor (supabase/setup.md § 9-6) is an update
  -- and rings nobody.
  drop trigger if exists push_on_prompt on prompt;
  create trigger push_on_prompt after insert on prompt
    for each row execute function push_ping();
end
$b$;

-- ---------------------------------------------------------------------------
-- THE WALL: nothing on this server answers anybody who has not signed in
--
-- 「ちがう。そもそもサインインがない状態でできることがないはずなのにそれが
--   あることを疑って言ってんの。小さい穴だけ潰しても意味ねえだろ、大きい
--   カバーで覆えやバカ」 OWNER 2026-09-22.
--
-- Not one table, one view, one function, one sequence, one bucket. This block
-- is the whole of it, and it is a COVER rather than a list: it names no table
-- and no function, so a table added to this file tomorrow is behind it the
-- day it is added. Every hole this closed was a line somebody wrote by hand
-- and a line nobody later remembered -- the same fault docs/DATA_SAFETY.md
-- names 「a list of keys, written by hand, that nobody remembered to add to」.
--
-- WHAT WAS OPEN, measured on 2026-09-22 before this block existed
-- (tools/rls-check.mjs, the run that has to go red first): 24 relations in
-- `public`, 69 functions, 5 sequences, both of storage's tables and both
-- buckets -- and three standing `alter default privileges` entries, so
-- everything made afterwards would have been open too. Nobody had to find a
-- bug: the publishable key is in www/net.js in the open, and that is all it
-- took to read every profile, every post, every reaction, every follow, and
-- every photograph anybody had ever put up.
--
-- TWO LAYERS AND THEY ANSWER DIFFERENT QUESTIONS. The grants below say
-- **whether you are anybody at all**; the policies above say **which of the
-- signed-in may touch which row**. A `using (true)` policy is not a hole any
-- more -- it means「every signed-in person」, which is what it was always
-- meant to say. This is why no policy was rewritten to add `is_member()`:
-- that would be the same sentence said twice, in two places, and one of them
-- would drift.
--
-- IT IS THE LAST THING IN THE FILE AND HAS TO BE. Everything above creates
-- tables and views, and Supabase's default privileges hand each new one to
-- `anon` as it is made. Revoking at the foot catches all of them; revoking at
-- the head would catch none.
--
-- AND IT SURVIVES BEING PASTED TWICE, like everything else here: a revoke of
-- something already revoked is not an error, and the default-privilege lines
-- are a state rather than a step.
do $w$
declare r record;
begin
  /* Whoever is pasting this file is who created the tables in it, and
     `alter default privileges` with no `for role` is about the current user
     only. On Supabase's SQL editor that is `postgres`; on a project where
     something else made them it is that. So it is said for every role that
     actually HAS a standing grant to anon in this schema AND whose defaults
     this user may change -- itself, or a role it is a member of -- read out
     of the catalogue rather than guessed. `supabase_admin` has such a grant
     on every Supabase project and is not the editor's to change: asking
     anyway failed the whole paste on the owner's server (2026-09-25, 42501),
     and what it makes is Supabase's own, not a table this file creates.
     tools/rls-check.mjs pastes this block as a non-superuser (EDITOR). */
  execute 'alter default privileges in schema public revoke all on tables    from anon';
  execute 'alter default privileges in schema public revoke all on sequences from anon';
  execute 'alter default privileges in schema public revoke all on functions from anon';
  for r in
    select distinct pg_get_userbyid(d.defaclrole) as who
      from pg_default_acl d
      join pg_namespace n on n.oid = d.defaclnamespace
     where n.nspname in ('public', 'storage')
       and array_to_string(d.defaclacl, ',') like '%anon=%'
       and pg_has_role(current_user, d.defaclrole, 'MEMBER')
  loop
    execute format(
      'alter default privileges for role %I in schema public  revoke all on tables    from anon', r.who);
    execute format(
      'alter default privileges for role %I in schema public  revoke all on sequences from anon', r.who);
    execute format(
      'alter default privileges for role %I in schema public  revoke all on functions from anon', r.who);
    execute format(
      'alter default privileges for role %I in schema storage revoke all on tables    from anon', r.who);
  end loop;
end
$w$;

revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;

-- FUNCTIONS NEED THE OTHER WORD AS WELL, and this is the half a revoke of
-- `anon` alone does not reach: PostgreSQL grants EXECUTE on every new
-- function to PUBLIC, and PUBLIC is not a role anybody is in -- it is
-- everybody, `anon` included. So `revoke ... from anon` on a function that
-- was never revoked from PUBLIC changes nothing at all, and 69 of them were
-- exactly that. Measured 2026-09-22.
--
-- Granting them back to `authenticated` in one line is not a widening and
-- cannot be: PUBLIC already included `authenticated`, so every function in
-- this schema was already theirs to run. What changes is only who else.
revoke all on all functions in schema public from public;
revoke all on all functions in schema public from anon;
grant execute on all functions in schema public to authenticated;

-- The files. `storage.objects` and `storage.buckets` belong to
-- `supabase_storage_admin`, so this is wrapped for the same reason their RLS
-- is above -- on a database where this is not ours to say, it says so and
-- goes on.
do $w$
begin
  execute 'revoke all on all tables in schema storage from anon';
exception when insufficient_privilege then
  raise notice '%', 'storage: not ours to revoke here -- Supabase does it';
end
$w$;

-- A PUBLIC BUCKET IS A URL THAT NEEDS NOTHING. No policy under it is ever
-- consulted: the object is served to whoever has the link. So no bucket is
-- public -- every bucket and not one by name, because the cover is the
-- mechanism, and a bucket made open on a server before this line (as
-- `post-media` was until 2026-09-22) is closed by it.
update storage.buckets set public = false where public;


-- THE ONE NAME THAT STAYS OPEN, and it is the owner's.
-- 「判断だけどこれは例外で」 OWNER DECISION 2026-09-22.
--
-- `email_taken()` is asked AT THE DOOR (www/net.js, with no token on it),
-- before an account exists, so a person signing up has no session to ask it
-- with. It is the single thing on this server a caller with no session may
-- run, it is named here rather than counted, and tools/rls-check.mjs counts
-- everything else as zero with this one named. An exception that is counted
-- is an exception that grows.
--
-- It is here, after the revoke, because order is the whole of it: the line
-- beside the function itself would be undone by the two lines above.
grant execute on function email_taken(text) to anon;
