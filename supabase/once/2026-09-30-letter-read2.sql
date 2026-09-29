-- 読むだけ。lingua の言語の letters の中身をそのまま頭から出す。
select 'letters '||to_char(s.at,'MM-DD HH24:MI:SS')||' no='||s.no||' len='||length(s.body::text) as what,
       left(s.body::text, 1800) as value
  from slice s join language l on l.id=s.language join profile p on p.id=l.owner
 where p.handle='lingua' and s.kind='letters';
