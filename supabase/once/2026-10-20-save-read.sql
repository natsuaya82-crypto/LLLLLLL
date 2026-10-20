-- 読むだけ（2026-10-20、オーナー「文字書く画面とか保存できないで that did not work って出る」）。
-- 何も残さない: 保存を一度だけ「その人として」やり直し、最後に自分で例外を投げて
-- 巻き戻す。答えは、通ったなら 'P0001 rolled back (it would have saved)'、
-- 断られたならサーバーの本当のエラー（sqlstate と文）。関数は pg_temp の中で、
-- この接続が終わると消える。
create or replace function pg_temp.lingua_try(p_lang uuid, p_kind text) returns text
language plpgsql as $$
declare s record; uid uuid;
begin
  select l.owner into uid from language l where l.id = p_lang;
  select * into s from slice where language = p_lang and kind = p_kind;
  if s is null then return 'no such slice'; end if;
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    perform slice_put(p_lang, p_kind, s.body,
                      (extract(epoch from now()) * 1000)::numeric, s.no, null);
    raise exception 'rolled back (it would have saved)';
  exception when others then
    return sqlstate || ' ' || sqlerrm;
  end;
end $$;

select o, what, value from (
  -- いつまで保存が届いていたか（日ごと、slice と slice_hist）
  select 1 o, 'slice saved ' || to_char(date_trunc('day', at), 'MM-DD') what, count(*)::text value
    from slice where at > now() - interval '21 days' group by date_trunc('day', at)
  union all
  select 2, 'hist ' || to_char(date_trunc('day', at), 'MM-DD'), count(*)::text
    from slice_hist where at > now() - interval '21 days' group by date_trunc('day', at)
  -- 本番に今ある slice・slice_hist の policy と、authenticated の権限
  union all
  select 3, 'policy ' || tablename || '.' || policyname, cmd || ' ' || permissive
    from pg_policies where tablename in ('slice', 'slice_hist', 'language')
  union all
  select 4, 'grant authenticated ' || table_name, string_agg(privilege_type, ',' order by privilege_type)
    from information_schema.role_table_grants
   where grantee = 'authenticated' and table_name in ('slice', 'slice_hist', 'language')
   group by table_name
  -- @lingua の言語の letters を、その人として保存し直して巻き戻した答え
  union all
  select 5, 'try lingua ' || l.id::text, pg_temp.lingua_try(l.id, 'letters')
    from language l join profile p on p.id = l.owner
   where p.handle = 'lingua'
     and exists (select 1 from slice s where s.language = l.id and s.kind = 'letters')
  -- いちばん最近 letters が保存された言語（誰のでも。中身は出さない）
  union all
  select 6, 'try latest letters', pg_temp.lingua_try(x.language, 'letters')
    from (select language from slice where kind = 'letters' order by at desc limit 1) x
  -- 最近の schema の手順
  union all
  select 7, 'schema_step ' || step, to_char(at, 'MM-DD HH24:MI')
    from (select * from schema_step order by at desc limit 5) z
) q order by o, what;
