-- Adds real sleep-quality signals (heart rate, HRV, breathing rate averaged
-- over the sleep window) plus the raw per-stage sample timeline needed to
-- render an actual stage timeline chart instead of just stage totals.
alter table sleep_logs
  add column if not exists avg_heart_rate_bpm numeric,
  add column if not exists avg_hrv_ms numeric,
  add column if not exists avg_respiratory_rate numeric,
  add column if not exists stage_segments jsonb;
