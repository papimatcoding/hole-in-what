-- Hole in What? · Audit V3 human telemetry snapshot
--
-- Server/admin aggregate input for scripts/audit3.ts. No tester IDs are returned.
-- Developer/self-test aliases are excluded so model calibration uses external beta behaviour:
-- legacy `Matkiller` plus the explicit `DEV |...` naming convention used by current smoke sessions.
-- Stale attempts are counted after 10 minutes.

with eligible_testers as (
  select tester_id,device_class
  from public.beta_testers
  where coalesce(alias,'') <> 'Matkiller'
    and coalesce(alias,'') not like 'DEV |%'
),
attempt_base as (
  select a.*,coalesce(t.device_class,'unknown') as device_class
  from public.beta_attempts a
  join eligible_testers t using (tester_id)
),
attempt_stats as (
  select
    build_id,level_id,mode,
    count(distinct tester_id)::int as players,
    count(*)::int as attempts,
    count(*) filter (where completed)::int as completed_attempts,
    count(*) filter (where attempt_number=1)::int as first_attempts,
    count(*) filter (where attempt_number=1 and completed)::int as first_attempt_completions,
    count(*) filter (where attempt_number>1)::int as retry_attempts,
    count(*) filter (where attempt_number>1 and completed)::int as retry_completions,
    count(*) filter (where not completed and ended_at is null and started_at < now()-interval '10 minutes')::int as stale_attempts,
    count(*) filter (where not completed and ended_at is not null)::int as explicit_abandons,
    round((count(*) filter (where completed))::numeric/nullif(count(*),0),4) as attempt_completion_rate,
    round((count(*) filter (where attempt_number=1 and completed))::numeric/nullif(count(*) filter (where attempt_number=1),0),4) as first_attempt_completion_rate,
    round((count(*) filter (where attempt_number>1 and completed))::numeric/nullif(count(*) filter (where attempt_number>1),0),4) as retry_completion_rate,
    round((greatest(count(*)-count(distinct tester_id),0))::numeric/nullif(count(distinct tester_id),0),3) as extra_attempts_per_player,
    percentile_cont(.5) within group (order by strokes) filter (where completed and strokes is not null) as median_strokes,
    percentile_cont(.75) within group (order by strokes) filter (where completed and strokes is not null) as p75_strokes,
    percentile_cont(.5) within group (order by time_ms) filter (where completed and time_ms is not null) as median_time_ms,
    round((avg(voids) filter (where completed and voids is not null))::numeric,3) as avg_voids_completed,
    count(distinct tester_id) filter (where device_class='mobile')::int as mobile_players,
    count(distinct tester_id) filter (where device_class='tablet')::int as tablet_players,
    count(distinct tester_id) filter (where device_class='desktop')::int as desktop_players,
    round((count(*) filter (where device_class in ('mobile','tablet') and completed))::numeric/
      nullif(count(*) filter (where device_class in ('mobile','tablet')),0),4) as mobile_completion_rate,
    round((count(*) filter (where device_class='desktop' and completed))::numeric/
      nullif(count(*) filter (where device_class='desktop'),0),4) as desktop_completion_rate
  from attempt_base
  group by build_id,level_id,mode
),
shot_base as (
  select s.*
  from public.beta_shots s
  join eligible_testers t using (tester_id)
),
shot_stats as (
  select
    build_id,level_id,
    count(*)::int as shots,
    count(*) filter (where input_kind='touch')::int as touch_shots,
    count(*) filter (where input_kind='mouse')::int as mouse_shots,
    count(*) filter (where input_kind='pen')::int as pen_shots,
    count(*) filter (where outcome='hole')::int as hole_shots,
    count(*) filter (where outcome='void')::int as void_shots,
    round((count(*) filter (where outcome='hole'))::numeric/nullif(count(*),0),4) as hole_shot_rate,
    round((count(*) filter (where outcome='void'))::numeric/nullif(count(*),0),4) as void_shot_rate,
    percentile_cont(.5) within group (order by duration_ms) as median_shot_duration_ms,
    round(avg(power)::numeric,4) as avg_power,
    round(stddev_pop(power)::numeric,4) as power_dispersion
  from shot_base
  group by build_id,level_id
),
first_shot_cells as (
  select
    build_id,level_id,
    floor(end_x/60)::int as cell_x,
    floor(end_y/60)::int as cell_y,
    count(*)::int as shots
  from shot_base
  where shot_index=1 and outcome <> 'void'
  group by build_id,level_id,floor(end_x/60),floor(end_y/60)
),
ranked_cells as (
  select *,row_number() over(partition by build_id,level_id order by shots desc,cell_y,cell_x) as rn,
    sum(shots) over(partition by build_id,level_id) as total_first_shots
  from first_shot_cells
),
route_clusters as (
  select build_id,level_id,
    jsonb_agg(jsonb_build_object(
      'cellX',cell_x,'cellY',cell_y,'shots',shots,
      'share',round(shots::numeric/nullif(total_first_shots,0),4)
    ) order by shots desc,cell_y,cell_x) filter (where rn<=6) as first_shot_route_clusters
  from ranked_cells
  group by build_id,level_id
),
feedback_stats as (
  select f.build_id,f.level_id,
    count(*)::int as feedback_n,
    round(avg(f.fun)::numeric,2) as avg_fun,
    round(avg(f.originality)::numeric,2) as avg_originality,
    round(avg(f.difficulty)::numeric,2) as avg_difficulty,
    round((avg(f.surprise) filter (where f.surprise is not null))::numeric,2) as avg_surprise
  from public.beta_level_feedback f
  join eligible_testers t using (tester_id)
  group by f.build_id,f.level_id
),
rows as (
  select
    a.*,
    coalesce(s.shots,0) as shots,
    coalesce(s.touch_shots,0) as touch_shots,
    coalesce(s.mouse_shots,0) as mouse_shots,
    coalesce(s.pen_shots,0) as pen_shots,
    coalesce(s.hole_shots,0) as hole_shots,
    coalesce(s.void_shots,0) as void_shots,
    s.hole_shot_rate,s.void_shot_rate,s.median_shot_duration_ms,s.avg_power,s.power_dispersion,
    coalesce(f.feedback_n,0) as feedback_n,
    f.avg_fun,f.avg_originality,f.avg_difficulty,f.avg_surprise,
    coalesce(r.first_shot_route_clusters,'[]'::jsonb) as first_shot_route_clusters
  from attempt_stats a
  left join shot_stats s using(build_id,level_id)
  left join feedback_stats f using(build_id,level_id)
  left join route_clusters r using(build_id,level_id)
)
select jsonb_build_object(
  'generatedAt',now(),
  'exclusions',jsonb_build_array('alias:Matkiller','alias-prefix:DEV |'),
  'levels',coalesce(jsonb_agg(to_jsonb(rows) order by build_id,mode,level_id),'[]'::jsonb)
) as audit3_human_snapshot
from rows;
