-- 2026-09-27 一回だけ。何度流しても同じ所に着く。
--
-- 今日のお題が来ない（OWNER 2026-09-27）。cron が daily-prompt を呼ぶ時の
-- 待ちが 1000ms で、モデルに聞く関数は 1 秒では返らない。net._http_response
-- に 07:00・08:00 とも timed_out=true。60 秒にして、今日の分を一回呼ぶ
-- （daily-prompt はその日の行があれば何もしない）。プロフィールには触らない。
select cron.alter_job(jobid,
         command := regexp_replace(command, 'timeout_milliseconds\s*:=\s*[0-9]+',
                                   'timeout_milliseconds:=60000'))
  from cron.job where jobname = 'daily-prompt';
do $$ begin execute (select command from cron.job where jobname = 'daily-prompt'); end $$;

select 'cron' as what,
       case when command ~ 'timeout_milliseconds:=60000' then 'timeout 60000'
            else 'timeout NOT changed' end as value
  from cron.job where jobname = 'daily-prompt';
