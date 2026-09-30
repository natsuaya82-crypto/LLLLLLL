-- 読むだけ。プロフィールの「demo reposted」が Lingua の投稿に付かない理由を測る。
-- 何も書かない（先頭の schema_step の一行はワークフローが足す記録）。
select what, value from (
  select 1 o, 'demo profile' what,
         string_agg(p.handle||' / '||coalesce(p.display,'')||' / '||p.id, ' | ') value
    from profile p where p.handle ilike '%demo%' or p.display ilike 'demo%'
  union all
  select 2, 'lingua post '||to_char(x.created_at,'MM-DD HH24:MI'),
         x.id||' boosts: '||coalesce((select string_agg(coalesce(b.display,b.handle)||'@'||b.handle||' '||to_char(r.created_at,'MM-DD HH24:MI'), ', ')
                                  from react r join profile b on b.id=r.actor
                                 where r.post=x.id and r.kind='boost'),'none')
    from post x join profile a on a.id=x.author
   where a.handle='lingua' and x.created_at > now() - interval '5 days'
  union all
  select 3, 'demo boosts',
         coalesce(string_agg(a.handle||' '||to_char(x.created_at,'MM-DD')||' boosted '||to_char(r.created_at,'MM-DD HH24:MI')||' hidden='||(x.hidden_at is not null), ' | ' order by r.created_at desc),'none')
    from react r join profile d on d.id=r.actor join post x on x.id=r.post join profile a on a.id=x.author
   where r.kind='boost' and (d.handle ilike '%demo%' or d.display ilike 'demo%')
) z order by o, what;
