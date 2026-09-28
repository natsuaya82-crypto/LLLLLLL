-- 2026-09-28 一回だけ。今日（太平洋時間 9/28）のお題が本番に無い。cron は 07:00・
-- 08:00 に鳴って「succeeded」だが、daily-prompt が何と答えたかは 6 時間で消えて
-- 残っていない。同じ呼び出し（cron.job の command そのもの）を一回鳴らし、答えは
-- 次の check の `push` の行（net._http_response）で読む。daily-prompt はその日の
-- 行があれば何もしないので、二度鳴っても一行。
do $$ begin execute (select command from cron.job where jobname = 'daily-prompt'); end $$;

select 'called' as what, 'daily-prompt at ' || to_char(now(), 'MM-DD HH24:MI') as value;
