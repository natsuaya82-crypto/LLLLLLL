-- 読むだけ（2026-10-22、線を全部消した字が空のまま残るかの確かめ）。表には触らない:
-- 本番の slice_merge() に見本の字の並びを渡して、答えを読むだけ。
with z as (select
  '[{"id":"lt.a","nm":"a"}]'::text blank,
  '[{"id":"lt.a","nm":"a","st":[{"pts":[[1,1],[9,9]]}]}]'::text drawn)
select 'erased here' what, slice_merge('letters', blank, drawn, drawn, false) value from z
union all select 'erased there', slice_merge('letters', drawn, blank, drawn, true) from z
union all select 'never agreed', slice_merge('letters', blank, drawn, '', false) from z;
