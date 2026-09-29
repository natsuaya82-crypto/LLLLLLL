-- 読むだけ。lingua の言語の letters の中身（字ごとの名前と画数）と、版の履歴。
select what, value from (
  select 1 o, 'slice '||s.kind||' no='||s.no||' at='||to_char(s.at,'MM-DD HH24:MI:SS') what,
         (select string_agg(coalesce(e->>'n', e->>'r', '?')||':'||coalesce(jsonb_array_length(e->'st'),0), ' ')
            from jsonb_array_elements(case when jsonb_typeof(s.body::jsonb)='array' then s.body::jsonb else s.body::jsonb->'l' end) e) value
    from slice s join language l on l.id=s.language join profile p on p.id=l.owner
   where p.handle='lingua' and s.kind='letters'
  union all
  select 2, 'body head', left(s.body::text, 400)
    from slice s join language l on l.id=s.language join profile p on p.id=l.owner
   where p.handle='lingua' and s.kind='letters'
) z order by o;
