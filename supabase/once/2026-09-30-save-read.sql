-- 読むだけ。字の保存がサーバーに届いているかを測る（2026-09-30、オーナーの「保存されない」）。
select what, value from (
  select 1 o, 'slice_put exists' what, (select count(*) from pg_proc where proname='slice_put')::text value
  union all select 2, 'slice_in exists', (select count(*) from pg_proc where proname='slice_in')::text
  union all select 3, 'last slice '||kind, to_char(max(at),'MM-DD HH24:MI:SS')||' n='||count(*) from slice where at > now() - interval '3 days' group by kind
  union all select 4, 'slice rows 24h', count(*)::text from slice where at > now() - interval '24 hours'
  union all select 5, 'post rows 24h', count(*)::text from post where created_at > now() - interval '24 hours'
  union all select 6, 'schema_step '||step, to_char(at,'MM-DD HH24:MI') from (select * from schema_step order by at desc limit 4) s
  union all select 7, 'lingua letters', to_char(max(s.at),'MM-DD HH24:MI:SS') from slice s join language l on l.id=s.language join profile p on p.id=l.owner where p.handle='lingua' and s.kind='letters'
) z order by o, what;
