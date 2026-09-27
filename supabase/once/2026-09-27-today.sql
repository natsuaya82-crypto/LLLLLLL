-- 2026-09-27 一回だけ。今日（太平洋時間の 9/27）のお題を入れる。
-- 「今日の文は君で作り変えて」OWNER 2026-09-27。daily-prompt と同じ決まりで
-- 書いた文で、過去のお題とは重ならない。同じ日の行があれば置き換える。
insert into prompt (on_day, text, says)
values ((now() at time zone 'America/Los_Angeles')::date,
        'The birds sang in the morning.',
        '{"en":"The birds sang in the morning.",
          "es":"Los pájaros cantaron por la mañana.",
          "pt":"Os pássaros cantaram de manhã.",
          "fr":"Les oiseaux ont chanté le matin.",
          "de":"Die Vögel sangen am Morgen.",
          "it":"Gli uccelli hanno cantato al mattino.",
          "ru":"Утром пели птицы.",
          "zh":"早上鸟儿在唱歌。",
          "ko":"아침에 새들이 노래했다.",
          "ja":"朝、鳥が歌っていた。"}'::jsonb)
on conflict (on_day) do update set text = excluded.text, says = excluded.says;

select 'today' as what, on_day::text || ' ' || text as value
  from prompt where on_day = (now() at time zone 'America/Los_Angeles')::date;
