-- 読むだけ（2026-10-24、「タイムラインがいっぱい」の確かめ）。表には触らない:
-- 電話の写し（lingua.posts.<uid>）は読んだ投稿を足すだけで減らない。全部を
-- 写したら何文字になるかを、投稿の body の長さで数える（写しは body に名前や
-- 数を足した形なので、これより少し大きい）。localStorage は 5M 文字くらい。
select 'all' what, count(*) posts, sum(length(body::text)) chars,
       round(avg(length(body::text))) avg_chars, max(length(body::text)) max_chars
  from post
union all
select 'seen (not hidden)', count(*), sum(length(body::text)),
       round(avg(length(body::text))), max(length(body::text))
  from post where hidden_at is null
union all
select 'last 7 days', count(*), sum(length(body::text)),
       round(avg(length(body::text))), max(length(body::text))
  from post where created_at > now() - interval '7 days'
union all
select 'top key: ' || k, count(*), sum(length(v::text)), round(avg(length(v::text))), max(length(v::text))
  from post, jsonb_each(body) e(k, v)
 group by k
order by 1;
