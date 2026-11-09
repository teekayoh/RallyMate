-- Demo request seed data.
-- Run this after creating real Supabase Auth users and matching profile rows
-- for James Carter and Sophia Evans.

insert into public.play_requests (
  creator_id,
  area,
  play_date,
  time_window,
  skill_level_wanted,
  format,
  note
)
select
  id,
  'Moseley',
  current_date + 1,
  '18:00 to 20:00',
  'improver',
  'singles',
  'Looking for a relaxed hit after work.'
from public.profiles
where display_name = 'James Carter';

insert into public.play_requests (
  creator_id,
  area,
  play_date,
  time_window,
  skill_level_wanted,
  format,
  note
)
select
  id,
  'Harborne',
  current_date + 2,
  '09:00 to 11:00',
  'advanced',
  'singles',
  'Want to play a proper set and do some serving practice.'
from public.profiles
where display_name = 'Sophia Evans';
