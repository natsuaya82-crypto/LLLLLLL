-- 読むだけ（2026-10-24、「タイムラインがいっぱい」の確かめ、二回目）。表には触らない。
-- 一回目（posts-size.sql）は列の名前が what / value でなく、ワークフローが null と
-- 表示したので、同じことを what / value で数え直す。電話の写し（lingua.posts.<uid>）
-- は読んだ投稿を足すだけで減らないので、全部を写した大きさが上限の目安になる。
select 'all posts' what,
       'n=' || count(*) || ' chars=' || coalesce(sum(length(body::text)), 0) ||
       ' avg=' || coalesce(round(avg(length(body::text))), 0) ||
       ' max=' || coalesce(max(length(body::text)), 0) value
  from post
union all
select 'key ' || k,
       'n=' || count(*) || ' chars=' || sum(length(v::text)) ||
       ' avg=' || round(avg(length(v::text))) || ' max=' || max(length(v::text))
  from post, jsonb_each(body) e(k, v)
 group by k
union all
select 'av starts', left(body->'av'->>'pic', 30) || ' n=' || count(*)
  from post where body->'av' ? 'pic'
 group by left(body->'av'->>'pic', 30);
