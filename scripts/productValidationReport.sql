-- Hole in What? · RC7 product validation report
-- Run in Supabase SQL editor or through the MCP execute_sql action.
-- Developer aliases and the legacy Matkiller identity are intentionally excluded.

with external_testers as (
  select tester_id
  from public.beta_testers
  where coalesce(alias,'') !~* '^DEV'
    and coalesce(alias,'') <> 'Matkiller'
),
starts as (
  select a.*
  from public.beta_attempts a
  join external_testers e using (tester_id)
  where a.build_id='hole-in-what-beta-rc7'
),
runs as (
  select r.*
  from public.beta_runs r
  join external_testers e using (tester_id)
  where r.build_id='hole-in-what-beta-rc7' and r.completed=true
),
events as (
  select p.*
  from public.beta_product_events p
  join external_testers e using (tester_id)
  where p.build_id='hole-in-what-beta-rc7'
),
pulses as (
  select p.*
  from public.beta_product_pulses p
  join external_testers e using (tester_id)
  where p.build_id='hole-in-what-beta-rc7'
),
cohort as (
  select distinct tester_id from starts
  union
  select distinct tester_id from events
),
sessions as (
  select tester_id,session_id,
         min(created_at) filter (where event_name='session_start') as started_at,
         max(created_at) filter (where event_name='session_end') as ended_at,
         max((metadata->>'durationMs')::numeric) filter (where event_name='session_end' and metadata ? 'durationMs') as duration_ms
  from events
  group by tester_id,session_id
),
replays as (
  select tester_id,level_id,count(*) as completions
  from runs
  group by tester_id,level_id
  having count(*)>1
)
select metric,value from (
  select 1 as ord,'external_testers'::text as metric,count(*)::numeric as value from cohort
  union all select 2,'attempts',count(*) from starts
  union all select 3,'completed_runs',count(*) from runs
  union all select 4,'attempt_completion_pct',round(100.0*count(*) filter (where completed)/nullif(count(*),0),1) from starts
  union all select 5,'tutorial_started_testers',count(distinct tester_id) from starts where level_id='classic-01'
  union all select 6,'tutorial_completed_testers',count(distinct tester_id) from runs where level_id='classic-01'
  union all select 7,'tutorial_completion_pct',round(100.0*(select count(distinct tester_id) from runs where level_id='classic-01')/nullif((select count(distinct tester_id) from starts where level_id='classic-01'),0),1)
  union all select 8,'reached_c03_pct',round(100.0*count(distinct tester_id) filter (where level_id='classic-03')/nullif((select count(*) from cohort),0),1) from starts
  union all select 9,'reached_c05_pct',round(100.0*count(distinct tester_id) filter (where level_id='classic-05')/nullif((select count(*) from cohort),0),1) from starts
  union all select 10,'hard_discovered_pct',round(100.0*count(distinct tester_id) filter (where event_name='hard_discovered')/nullif((select count(*) from cohort),0),1) from events
  union all select 11,'hard_started_pct',round(100.0*count(distinct tester_id) filter (where mode='troll')/nullif((select count(*) from cohort),0),1) from starts
  union all select 12,'hard_completed_pct',round(100.0*count(distinct tester_id) filter (where mode='troll')/nullif((select count(*) from cohort),0),1) from runs
  union all select 13,'avg_session_minutes',round(avg(duration_ms)/60000.0,2) from sessions where duration_ms is not null
  union all select 14,'returned_another_day_pct',round(100.0*count(*) filter (where days>1)/nullif(count(*),0),1) from (select tester_id,count(distinct started_at::date) as days from sessions where started_at is not null group by tester_id) x
  union all select 15,'voluntary_replay_testers_pct',round(100.0*count(distinct tester_id)/nullif((select count(*) from cohort),0),1) from replays
  union all select 16,'pulse_response_pct',round(100.0*(select count(*) from pulses)/nullif((select count(distinct tester_id) from events where event_name='pulse_view'),0),1)
  union all select 17,'keep_playing_yes_pct',round(100.0*count(*) filter (where would_keep_playing)/nullif(count(*),0),1) from pulses
  union all select 18,'purchase_yes_pct',round(100.0*count(*) filter (where purchase_intent='yes')/nullif(count(*),0),1) from pulses
  union all select 19,'purchase_yes_or_maybe_pct',round(100.0*count(*) filter (where purchase_intent in ('yes','maybe'))/nullif(count(*),0),1) from pulses
) metrics
order by ord;

-- Level quality snapshot (external RC7 only). This is a separate statement,
-- so it intentionally repeats the external tester CTE.
with external_testers as (
  select tester_id
  from public.beta_testers
  where coalesce(alias,'') !~* '^DEV'
    and coalesce(alias,'') <> 'Matkiller'
)
select f.mode,f.level_id,count(*) as ratings,
       round(avg(f.fun),2) as avg_fun,
       round(avg(f.originality),2) as avg_originality,
       round(avg(f.difficulty),2) as avg_difficulty,
       round(avg(f.surprise),2) as avg_surprise
from public.beta_level_feedback f
join external_testers e using (tester_id)
where f.build_id='hole-in-what-beta-rc7'
group by f.mode,f.level_id
order by f.mode,f.level_id;
