-- Hole in What? · aggregate beta telemetry snapshot
--
-- Run with server/admin database access only. The result contains no tester_id values and is intended
-- to be exported as an Audit/Design Advisor input snapshot. Stale attempts are counted after 10 min.

with attempt_stats as (
  select
    a.build_id,
    a.level_id,
    a.mode,
    count(distinct a.tester_id)::int as players,
    count(*)::int as attempts,
    count(*) filter (where a.completed)::int as completed_attempts,
    count(*) filter (where not a.completed and a.ended_at is null and a.started_at < now() - interval '10 minutes')::int as stale_attempts,
    count(*) filter (where not a.completed and a.ended_at is not null)::int as explicit_abandons,
    round((count(*) filter (where a.completed))::numeric / nullif(count(*),0),4) as attempt_completion_rate,
    round((greatest(count(*) - count(distinct a.tester_id),0))::numeric / nullif(count(distinct a.tester_id),0),3) as extra_attempts_per_player,
    percentile_cont(0.5) within group (order by a.strokes) filter (where a.completed and a.strokes is not null) as median_strokes,
    percentile_cont(0.75) within group (order by a.strokes) filter (where a.completed and a.strokes is not null) as p75_strokes,
    percentile_cont(0.5) within group (order by a.time_ms) filter (where a.completed and a.time_ms is not null) as median_time_ms,
    round(avg(a.voids) filter (where a.completed and a.voids is not null)::numeric,3) as avg_voids_completed
  from public.beta_attempts a
  group by a.build_id,a.level_id,a.mode
),
shot_stats as (
  select
    s.build_id,
    s.level_id,
    count(*)::int as shots,
    count(*) filter (where s.input_kind='touch')::int as touch_shots,
    count(*) filter (where s.input_kind='mouse')::int as mouse_shots,
    count(*) filter (where s.input_kind='pen')::int as pen_shots,
    count(*) filter (where s.outcome='hole')::int as hole_shots,
    count(*) filter (where s.outcome='void')::int as void_shots,
    round((count(*) filter (where s.outcome='hole'))::numeric/nullif(count(*),0),4) as hole_shot_rate,
    round((count(*) filter (where s.outcome='void'))::numeric/nullif(count(*),0),4) as void_shot_rate,
    percentile_cont(0.5) within group (order by s.duration_ms) as median_shot_duration_ms
  from public.beta_shots s
  group by s.build_id,s.level_id
),
feedback_stats as (
  select
    f.build_id,
    f.level_id,
    count(*)::int as feedback_n,
    round(avg(f.fun)::numeric,2) as avg_fun,
    round(avg(f.originality)::numeric,2) as avg_originality,
    round(avg(f.difficulty)::numeric,2) as avg_difficulty,
    round(avg(f.surprise)::numeric,2) filter (where f.surprise is not null) as avg_surprise
  from public.beta_level_feedback f
  group by f.build_id,f.level_id
),
device_stats as (
  select
    a.build_id,
    a.level_id,
    count(distinct a.tester_id) filter (where t.device_class='mobile')::int as mobile_players,
    count(distinct a.tester_id) filter (where t.device_class='tablet')::int as tablet_players,
    count(distinct a.tester_id) filter (where t.device_class='desktop')::int as desktop_players
  from public.beta_attempts a
  left join public.beta_testers t on t.tester_id=a.tester_id
  group by a.build_id,a.level_id
),
rows as (
  select
    a.build_id,
    a.level_id,
    a.mode,
    a.players,
    a.attempts,
    a.completed_attempts,
    a.stale_attempts,
    a.explicit_abandons,
    a.attempt_completion_rate,
    a.extra_attempts_per_player,
    a.median_strokes,
    a.p75_strokes,
    a.median_time_ms,
    a.avg_voids_completed,
    coalesce(s.shots,0) as shots,
    coalesce(s.touch_shots,0) as touch_shots,
    coalesce(s.mouse_shots,0) as mouse_shots,
    coalesce(s.pen_shots,0) as pen_shots,
    coalesce(s.hole_shots,0) as hole_shots,
    coalesce(s.void_shots,0) as void_shots,
    s.hole_shot_rate,
    s.void_shot_rate,
    s.median_shot_duration_ms,
    coalesce(d.mobile_players,0) as mobile_players,
    coalesce(d.tablet_players,0) as tablet_players,
    coalesce(d.desktop_players,0) as desktop_players,
    coalesce(f.feedback_n,0) as feedback_n,
    f.avg_fun,
    f.avg_originality,
    f.avg_difficulty,
    f.avg_surprise
  from attempt_stats a
  left join shot_stats s using (build_id,level_id)
  left join feedback_stats f using (build_id,level_id)
  left join device_stats d using (build_id,level_id)
)
select jsonb_build_object(
  'generatedAt',now(),
  'levels',coalesce(jsonb_agg(to_jsonb(rows) order by build_id,mode,level_id),'[]'::jsonb)
) as beta_telemetry_snapshot
from rows;
