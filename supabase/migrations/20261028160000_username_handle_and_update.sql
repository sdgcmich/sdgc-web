-- Migration: username_handle_and_update
-- 1. Adds public.generate_unique_username(first_name, fallback) function
-- 2. Updates handle_new_user() to default username from first name + numbers if collision
-- 3. Updates update_member_profile() to allow members to safely update their username handle while keeping their primary key ID fixed

-- 1. Helper to generate unique username from first name (e.g., "sarah", "sarah1", "sarah2"...)
create or replace function public.generate_unique_username(
  p_first_name text,
  p_fallback text default 'member'
)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_base text;
  v_candidate text;
  v_counter integer := 1;
begin
  -- Strip non-alphanumeric characters and convert to lowercase
  v_base := lower(regexp_replace(coalesce(trim(p_first_name), ''), '[^a-zA-Z0-9]', '', 'g'));
  if length(v_base) < 2 then
    v_base := lower(regexp_replace(coalesce(trim(p_fallback), 'member'), '[^a-zA-Z0-9]', '', 'g'));
  end if;
  if length(v_base) < 2 then
    v_base := 'member';
  end if;

  -- 1st attempt: bare first name base (e.g. "sarah")
  v_candidate := v_base;
  if not exists (select 1 from public.profiles where lower(username) = v_candidate) then
    return v_candidate;
  end if;

  -- Subsequent attempts: append number sequentially until available (e.g. "sarah1", "sarah2"...)
  loop
    v_candidate := v_base || v_counter::text;
    if not exists (select 1 from public.profiles where lower(username) = v_candidate) then
      return v_candidate;
    end if;
    v_counter := v_counter + 1;
  end loop;
end;
$$;

grant execute on function public.generate_unique_username(text, text) to anon, authenticated, service_role;

-- 2. Update handle_new_user trigger function to use generate_unique_username
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  m_meta jsonb;
  m_username text;
  m_first_name text;
  m_last_name text;
  m_project_codes jsonb;
  m_code text;
  active_term_id uuid;
begin
  m_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  m_first_name := coalesce(m_meta->>'first_name', 'Member');
  m_last_name := coalesce(m_meta->>'last_name', 'Member');

  -- Determine normalized username handle:
  -- If explicitly supplied in metadata and non-empty, use it (or append number if taken).
  -- Otherwise, default to first name with sequential number if taken.
  if m_meta->>'username' is not null and trim(m_meta->>'username') <> '' then
    m_username := lower(trim(m_meta->>'username'));
    if exists (select 1 from public.profiles where lower(username) = m_username) then
      m_username := public.generate_unique_username(m_username, 'member');
    end if;
  else
    m_username := public.generate_unique_username(m_first_name, split_part(new.email, '@', 1));
  end if;

  -- Insert profile with generated/validated handle
  insert into public.profiles (
    id,
    username,
    first_name,
    last_name,
    phone,
    secondary_phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    birth_month,
    birth_day,
    spouse_name,
    is_master_gardener,
    directory_opt_out,
    gardening_interests,
    volunteer_experience,
    interests_experience,
    updated_at
  )
  values (
    new.id,
    m_username,
    m_first_name,
    m_last_name,
    m_meta->>'phone',
    m_meta->>'secondary_phone',
    m_meta->>'address_line1',
    m_meta->>'address_line2',
    m_meta->>'city',
    m_meta->>'state',
    m_meta->>'postal_code',
    (m_meta->>'birth_month')::integer,
    (m_meta->>'birth_day')::integer,
    m_meta->>'spouse_name',
    coalesce((m_meta->>'is_master_gardener')::boolean, false),
    coalesce((m_meta->>'directory_opt_out')::boolean, false),
    m_meta->>'gardening_interests',
    m_meta->>'volunteer_experience',
    coalesce(m_meta->>'interests_experience', m_meta->>'gardening_interests'),
    now()
  )
  on conflict (id) do update set
    first_name = coalesce(excluded.first_name, profiles.first_name),
    last_name = coalesce(excluded.last_name, profiles.last_name),
    phone = coalesce(excluded.phone, profiles.phone),
    secondary_phone = coalesce(excluded.secondary_phone, profiles.secondary_phone),
    address_line1 = coalesce(excluded.address_line1, profiles.address_line1),
    address_line2 = coalesce(excluded.address_line2, profiles.address_line2),
    city = coalesce(excluded.city, profiles.city),
    state = coalesce(excluded.state, profiles.state),
    postal_code = coalesce(excluded.postal_code, profiles.postal_code),
    birth_month = coalesce(excluded.birth_month, profiles.birth_month),
    birth_day = coalesce(excluded.birth_day, profiles.birth_day),
    spouse_name = coalesce(excluded.spouse_name, profiles.spouse_name),
    is_master_gardener = coalesce(excluded.is_master_gardener, profiles.is_master_gardener),
    directory_opt_out = coalesce(excluded.directory_opt_out, profiles.directory_opt_out),
    gardening_interests = coalesce(excluded.gardening_interests, profiles.gardening_interests),
    volunteer_experience = coalesce(excluded.volunteer_experience, profiles.volunteer_experience),
    interests_experience = coalesce(excluded.interests_experience, profiles.interests_experience),
    updated_at = now();

  -- Insert project interests if present in metadata array
  m_project_codes := m_meta->'project_interests';
  if m_project_codes is not null and jsonb_typeof(m_project_codes) = 'array' then
    for m_code in select jsonb_array_elements_text(m_project_codes) loop
      if exists (select 1 from public.project_interests where code = m_code) then
        insert into public.profile_interests (user_id, project_code)
        values (new.id, m_code)
        on conflict (user_id, project_code) do nothing;
      end if;
    end loop;
  end if;

  -- Look up active term or latest term to create initial pending membership
  select id into active_term_id
  from public.membership_terms
  where opens_at <= now() and closes_at >= now()
  order by year desc
  limit 1;

  if active_term_id is null then
    select id into active_term_id
    from public.membership_terms
    order by year desc
    limit 1;
  end if;

  if active_term_id is not null then
    insert into public.memberships (user_id, term_id, status, notes)
    values (new.id, active_term_id, 'pending', 'Online member registration')
    on conflict (user_id, term_id) do nothing;
  end if;

  return new;
end;
$$;

-- 3. Update public.update_member_profile to allow updating username handle
create or replace function public.update_member_profile(
  p_first_name text,
  p_last_name text,
  p_spouse_name text default null,
  p_phone text default null,
  p_secondary_phone text default null,
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_city text default null,
  p_state text default null,
  p_postal_code text default null,
  p_birth_month integer default null,
  p_birth_day integer default null,
  p_is_master_gardener boolean default false,
  p_directory_opt_out boolean default false,
  p_gardening_interests text default null,
  p_volunteer_experience text default null,
  p_project_interests text[] default '{}'::text[],
  p_username text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid;
  v_code text;
  v_norm_username text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Validate and normalize username handle if provided
  if p_username is not null and trim(p_username) <> '' then
    v_norm_username := lower(trim(p_username));
    if length(v_norm_username) < 3 or length(v_norm_username) > 30 then
      raise exception 'Username must be between 3 and 30 characters';
    end if;
    if v_norm_username !~ '^[a-z0-9_-]+$' then
      raise exception 'Username may only contain letters, numbers, underscores, and hyphens';
    end if;

    -- Ensure handle uniqueness among other accounts
    if exists (
      select 1 from public.profiles
      where lower(username) = v_norm_username
        and id <> v_user_id
    ) then
      raise exception 'Username @% is already in use by another member', v_norm_username;
    end if;
  end if;

  update public.profiles set
    username = coalesce(v_norm_username, username),
    first_name = p_first_name,
    last_name = p_last_name,
    spouse_name = p_spouse_name,
    phone = p_phone,
    secondary_phone = p_secondary_phone,
    address_line1 = p_address_line1,
    address_line2 = p_address_line2,
    city = p_city,
    state = p_state,
    postal_code = p_postal_code,
    birth_month = p_birth_month,
    birth_day = p_birth_day,
    is_master_gardener = coalesce(p_is_master_gardener, false),
    directory_opt_out = coalesce(p_directory_opt_out, false),
    gardening_interests = p_gardening_interests,
    volunteer_experience = p_volunteer_experience,
    interests_experience = coalesce(p_gardening_interests, p_volunteer_experience),
    updated_at = now()
  where id = v_user_id;

  delete from public.profile_interests where user_id = v_user_id;

  if p_project_interests is not null then
    foreach v_code in array p_project_interests loop
      if exists (select 1 from public.project_interests where code = v_code) then
        insert into public.profile_interests (user_id, project_code)
        values (v_user_id, v_code);
      end if;
    end loop;
  end if;
end;
$$;

grant execute on function public.update_member_profile(
  text, text, text, text, text, text, text, text, text, text, integer, integer, boolean, boolean, text, text, text[], text
) to authenticated;

