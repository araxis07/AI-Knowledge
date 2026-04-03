create table if not exists private.rate_limit_windows (
  rate_key text not null,
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds > 0),
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (rate_key, window_start, window_seconds)
);

revoke all on private.rate_limit_windows from public;
revoke all on private.rate_limit_windows from anon;
revoke all on private.rate_limit_windows from authenticated;

create index if not exists rate_limit_windows_expires_at_idx
  on private.rate_limit_windows (expires_at asc);

drop trigger if exists rate_limit_windows_set_updated_at on private.rate_limit_windows;

create trigger rate_limit_windows_set_updated_at
before update on private.rate_limit_windows
for each row
execute function public.set_current_timestamp_updated_at();

create or replace function public.take_rate_limit(
  p_rate_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  request_count integer,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_window_start timestamptz;
  v_request_count integer;
begin
  if char_length(trim(coalesce(p_rate_key, ''))) = 0 then
    raise exception 'Rate limit key is required.';
  end if;

  if p_limit <= 0 then
    raise exception 'Rate limit must be greater than zero.';
  end if;

  if p_window_seconds <= 0 then
    raise exception 'Rate limit window must be greater than zero.';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into private.rate_limit_windows as rl (
    rate_key,
    window_start,
    window_seconds,
    request_count,
    expires_at
  )
  values (
    p_rate_key,
    v_window_start,
    p_window_seconds,
    1,
    v_window_start + make_interval(secs => p_window_seconds)
  )
  on conflict (rate_key, window_start, window_seconds) do update
    set request_count = rl.request_count + 1,
        updated_at = now()
  returning rl.request_count into v_request_count;

  return query
  select
    v_request_count <= p_limit,
    v_request_count,
    greatest(p_limit - v_request_count, 0),
    v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.take_rate_limit(text, integer, integer) from public;
revoke all on function public.take_rate_limit(text, integer, integer) from anon;
revoke all on function public.take_rate_limit(text, integer, integer) from authenticated;

grant execute on function public.take_rate_limit(text, integer, integer) to service_role;
