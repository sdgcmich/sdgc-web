-- Migration: super_admin_and_avatar
-- 1. Adds 'super_admin' role, updates role check constraint, protects super_admin accounts
-- 2. Restricts promotion/demotion to admin so ONLY super_admin can perform it
-- 3. Adds avatar_url to public.profiles, updates member_directory and credential lookup
-- 4. Creates public 'avatars' storage bucket with RLS policies

-- 1. Role Check Constraint & Initial Super Admins
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('super_admin', 'admin', 'editor', 'treasurer'));

-- Seed super_admin role for administrative accounts
insert into public.user_roles (user_id, role)
select id, 'super_admin' from public.profiles where username in ('super_admin', 'redwan_admin')
on conflict do nothing;

-- 2. Update has_capability to recognize super_admin across all capabilities
create or replace function public.has_capability(capability_name text, check_user_id uuid default null)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  target_id uuid := coalesce(check_user_id, auth.uid());
begin
  if target_id is null then
    return false;
  end if;

  -- Super admin possesses all capabilities
  if exists (select 1 from public.user_roles where user_id = target_id and role = 'super_admin') then
    return true;
  end if;

  -- Special capability to manage administrator and super_admin roles: ONLY super_admin
  if capability_name in ('roles.admin', 'super_admin.manage') then
    return false;
  end if;

  -- Admin role possesses all standard admin capabilities except managing other admins/superadmins
  if exists (select 1 from public.user_roles where user_id = target_id and role = 'admin') then
    return true;
  end if;

  -- Content / Media / Events management
  if capability_name in ('content.manage', 'events.manage', 'media.manage') then
    return exists (select 1 from public.user_roles where user_id = target_id and role in ('admin', 'editor'));
  end if;

  -- Dues reconciliation & Membership approvals
  if capability_name in ('dues.reconcile', 'memberships.approve') then
    return exists (select 1 from public.user_roles where user_id = target_id and role in ('admin', 'treasurer'));
  end if;

  -- Member management, inbox, editor/treasurer role assignment
  if capability_name in ('members.manage', 'messages.manage', 'roles.manage', 'settings.manage', 'audit.view') then
    return exists (select 1 from public.user_roles where user_id = target_id and role in ('super_admin', 'admin'));
  end if;

  return false;
end;
$$;

-- 3. Secure set_user_roles procedure with Super Admin hierarchy & Admin promotion restrictions
create or replace function public.set_user_roles(
  p_target_user_id uuid,
  p_new_roles text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_is_actor_super_admin boolean := false;
  v_is_actor_admin boolean := false;
  v_target_has_super_admin boolean := false;
  v_target_has_admin boolean := false;
  v_new_has_super_admin boolean := false;
  v_new_has_admin boolean := false;
  v_role text;
begin
  if v_actor_id is null then
    raise exception 'Authentication required to manage roles';
  end if;

  if p_target_user_id is null then
    raise exception 'Target user id cannot be null';
  end if;

  -- Check actor privileges
  select exists (select 1 from public.user_roles where user_id = v_actor_id and role = 'super_admin')
    into v_is_actor_super_admin;
  select exists (select 1 from public.user_roles where user_id = v_actor_id and role = 'admin')
    into v_is_actor_admin;

  if not (v_is_actor_super_admin or v_is_actor_admin) then
    raise exception 'Unauthorized to manage member roles';
  end if;

  -- Check target user's current roles
  select exists (select 1 from public.user_roles where user_id = p_target_user_id and role = 'super_admin')
    into v_target_has_super_admin;
  select exists (select 1 from public.user_roles where user_id = p_target_user_id and role = 'admin')
    into v_target_has_admin;

  -- Inspect proposed new roles
  if p_new_roles is not null and array_length(p_new_roles, 1) > 0 then
    foreach v_role in array p_new_roles loop
      if v_role = 'super_admin' then
        v_new_has_super_admin := true;
      elsif v_role = 'admin' then
        v_new_has_admin := true;
      elsif v_role not in ('editor', 'treasurer') then
        raise exception 'Invalid role name: %', v_role;
      end if;
    end loop;
  end if;

  -- Security Rule 1: No normal admin can touch a super_admin account
  if v_target_has_super_admin and not v_is_actor_super_admin then
    raise exception 'Unauthorized: Normal administrators cannot modify or remove a Super Administrator account';
  end if;

  -- Security Rule 2: Only super_admin can assign or revoke super_admin role
  if (v_target_has_super_admin != v_new_has_super_admin) and not v_is_actor_super_admin then
    raise exception 'Unauthorized: Only a Super Administrator can assign or revoke the Super Admin role';
  end if;

  -- Security Rule 3: Only super_admin can promote or demote to/from admin role
  if (v_target_has_admin != v_new_has_admin) and not v_is_actor_super_admin then
    raise exception 'Unauthorized: Only a Super Administrator can promote or demote an Administrator';
  end if;

  -- Last Super Admin Protection
  if v_target_has_super_admin and not v_new_has_super_admin then
    if (select count(*) from public.user_roles where role = 'super_admin' and user_id != p_target_user_id) < 1 then
      raise exception 'Cannot remove the last Super Administrator';
    end if;
  end if;

  -- Last Admin Protection
  if v_target_has_admin and not v_new_has_admin then
    if (select count(*) from public.user_roles where role in ('super_admin', 'admin') and user_id != p_target_user_id) < 1 then
      raise exception 'Cannot remove the last Administrator';
    end if;
  end if;

  -- Atomic transactional replacement of roles
  delete from public.user_roles where user_id = p_target_user_id;

  if p_new_roles is not null and array_length(p_new_roles, 1) > 0 then
    foreach v_role in array p_new_roles loop
      insert into public.user_roles (user_id, role, granted_by)
      values (p_target_user_id, v_role, v_actor_id);
    end loop;
  end if;

  -- Truthful, transactional audit log insertion
  insert into public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) values (
    v_actor_id,
    'roles.updated',
    'user',
    p_target_user_id,
    jsonb_build_object(
      'roles', p_new_roles,
      'is_super_admin_mutation', v_new_has_super_admin or v_target_has_super_admin,
      'is_admin_mutation', v_new_has_admin or v_target_has_admin
    ),
    now()
  );
end;
$$;

grant execute on function public.set_user_roles(uuid, text[]) to authenticated;

-- 4. Add avatar_url to public.profiles
alter table public.profiles
  add column if not exists avatar_url text;

-- 5. Update public.member_directory view with avatar_url
drop view if exists public.member_directory;

create view public.member_directory
with (security_barrier = true)
as
select
  p.id,
  p.username,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.city,
  p.state,
  p.phone,
  p.secondary_phone,
  p.is_master_gardener,
  p.gardening_interests,
  p.volunteer_experience,
  p.interests_experience,
  coalesce(
    (
      select jsonb_agg(pi.project_code order by pi.project_code)
      from public.profile_interests pi
      where pi.user_id = p.id
    ),
    '[]'::jsonb
  ) as project_interests
from public.profiles p
where (
  (public.is_active_member() or public.has_capability('members.manage'))
  and (
    public.is_active_member(p.id)
    and coalesce(p.directory_opt_out, false) = false
  )
);

grant select on public.member_directory to authenticated;

-- 6. Update lookup_member_credential to include avatar_url
drop function if exists public.lookup_member_credential(text);

create or replace function public.lookup_member_credential(lookup_code text)
returns table (
  id uuid,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  city text,
  state text,
  is_master_gardener boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.city,
    p.state,
    p.is_master_gardener,
    p.created_at
  from public.profiles p
  where
    p.id::text ilike (lower(trim(lookup_code)) || '%')
    or lower(p.username) = lower(trim(lookup_code))
    or lower(p.username) = lower(trim(replace(lookup_code, '@', '')))
    or lower(trim(p.first_name || ' ' || p.last_name)) = lower(trim(lookup_code))
  limit 1;
$$;

grant execute on function public.lookup_member_credential(text) to anon, authenticated, service_role;

-- 7. Public 'avatars' storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_select" on storage.objects;
create policy "avatars_public_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars_authenticated_insert" on storage.objects;
create policy "avatars_authenticated_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_authenticated_update" on storage.objects;
create policy "avatars_authenticated_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars_authenticated_delete" on storage.objects;
create policy "avatars_authenticated_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars');
