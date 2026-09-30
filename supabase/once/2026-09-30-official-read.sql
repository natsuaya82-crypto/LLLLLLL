-- 読むだけ。公式アカウント（オーナーのアドレス、md5 で照らす）が誰で、何を持っているか。
select 'account' as what, p.handle||' name='||coalesce(p.display,'')||' id='||u.id as value
  from auth.users u left join profile p on p.id=u.id
 where md5(lower(u.email))='6155d9a6fb65c3eb7ee081385dcdfb40'
union all
select 'language', l.id||' name='||coalesce(l.name,'')||' pub='||coalesce(l.published_at::text,'-')
  from auth.users u join language l on l.owner=u.id
 where md5(lower(u.email))='6155d9a6fb65c3eb7ee081385dcdfb40'
union all
select 'handle lingua', p.id::text from profile p where p.handle='lingua';
