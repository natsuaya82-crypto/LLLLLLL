-- 2026-09-30 一回だけ。公式の印を @lingua につけ、@lingua の名前の無い言語を
-- 非公開にする（docs/FEATURE_RULES.md 2026-09-30 公式アカウントのプロフィール）。
-- 先に supabase/schema.sql を貼ってあること ── profile_seen に official の列が
-- 載るのはそちら。列が無い時のためにだけ、下の一行が同じ列を足す。
--
-- 消す物は無い。5262c1dd の行も slice も一バイトも動かさず、published_at を
-- 空にするだけ。@lingua の言語でなければ何もしない。
alter table profile add column if not exists official boolean not null default false;

update profile set official = true where handle = 'lingua';

update language l set published_at = null
  from profile p
 where l.id = '5262c1dd-d55a-413b-8727-4e13d9ed317f'
   and p.id = l.owner and p.handle = 'lingua';

select 'official' as what, handle as value from profile where official
union all
select 'language', l.id || ' name=' || coalesce(l.name, '') || ' pub=' || coalesce(l.published_at::text, '-')
  from language l join profile p on p.id = l.owner
 where p.handle = 'lingua';
