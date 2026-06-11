-- Fix: Allow public access to tables (for QR code scanning)
-- Customers need to be able to resolve table QR codes without authentication

begin;

-- Drop the restrictive policy that requires authentication
drop policy if exists "Restaurant can view own tables" on public.tables;
drop policy if exists tables_select_own_restaurant on public.tables;
drop policy if exists tables_write_own_restaurant on public.tables;

-- 1) PUBLIC READ: Anyone can look up a table by QR code
-- This is needed for customers scanning QR codes at the table
create policy tables_select_public
on public.tables
for select
to authenticated, anon
using (true);

-- 2) AUTHENTICATED WRITE: Restaurant staff can create/update/delete tables
create policy tables_write_own_restaurant
on public.tables
for all
to authenticated
using (
  restaurant_id in (
    select u.restaurant_id
    from public.users u
    where u.id = auth.uid()
      and u.restaurant_id is not null
      and u.role in ('owner', 'staff')
  )
)
with check (
  restaurant_id in (
    select u.restaurant_id
    from public.users u
    where u.id = auth.uid()
      and u.restaurant_id is not null
      and u.role in ('owner', 'staff')
  )
);

-- Verify the policies are now correct
select policyname, permissive, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'tables'
order by policyname;

commit;
