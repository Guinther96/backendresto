-- Fix: Add missing RLS policy for users table
-- Allows users of the same restaurant to read each other's profiles
-- This is needed for getStaff() functionality

begin;

-- Drop the old incomplete policy set if needed
drop policy if exists users_read_same_restaurant on public.users;

-- Create the missing policy: Allow users to read other users in the same restaurant
create policy users_read_same_restaurant
on public.users
for select
to authenticated
using (
  -- User can read themselves
  id = auth.uid()
  or
  -- OR user can read anyone in their restaurant
  (
    restaurant_id is not null
    and restaurant_id in (
      select u.restaurant_id
      from public.users u
      where u.id = auth.uid()
        and u.restaurant_id is not null
    )
  )
);

commit;

-- Verify the policies are now correct
select policyname, permissive, cmd
from pg_policies
where schemaname = 'public' and tablename = 'users'
order by policyname;
