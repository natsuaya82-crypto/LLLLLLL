-- 読むだけ（2026-10-20、language_read を直した後の確かめ）。何も残さない:
-- @lingua として新しい言語の行を「作って返して」（アプリと同じ RETURNING）、
-- 通ったら自分で例外を投げて巻き戻す。答えは、通ったなら
-- 'P0001 rolled back (it would have made it)'、断られたならサーバーの本当のエラー。
create or replace function pg_temp.lingua_make(p_uid uuid) returns text
language plpgsql as $$
declare got uuid;
begin
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    insert into language(id, owner, name) values (gen_random_uuid(), p_uid, 'probe')
      returning id into got;
    raise exception 'rolled back (it would have made it)';
  exception when others then
    return sqlstate || ' ' || sqlerrm;
  end;
end $$;

select 'policy language_read' what, qual value from pg_policies
 where tablename = 'language' and policyname = 'language_read'
union all
select 'make as @lingua', pg_temp.lingua_make(p.id) from profile p where p.handle = 'lingua';
