-- ========================================
-- FIX: Data Leakage Between Restaurants
-- ========================================
-- This script fixes RLS policies and data integrity issues
-- that allow restaurant users to access other restaurants' data

begin;

-- 1) DROP all dangerous/incorrect policies
drop policy if exists "Restaurant can view own tables" on public.tables;
drop policy if exists "Restaurant can view own order_items" on public.order_items;
drop policy if exists "Restaurant can view own menu_items" on public.menu_items;

-- 2) FIX: Ensure order_items.restaurant_id is properly populated from orders
-- First, populate missing restaurant_id values from orders table
update public.order_items oi
set restaurant_id = o.restaurant_id
from public.orders o
where oi.order_id = o.id
  and oi.restaurant_id is null;

-- 3) Add foreign key constraint to order_items.restaurant_id (if not already exists)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'order_items'
    and constraint_name = 'fk_order_items_restaurant_id'
  ) then
    alter table public.order_items
    add constraint fk_order_items_restaurant_id
    foreign key (restaurant_id)
    references public.restaurants(id) on delete cascade;
  end if;
end
$$;

-- 4) Add index for restaurant_id on order_items
create index if not exists idx_order_items_restaurant_id
on public.order_items(restaurant_id);

-- 5) CORRECT RLS POLICY: order_items - JOIN through orders and users
drop policy if exists order_items_select_own_restaurant on public.order_items;
drop policy if exists order_items_write_own_restaurant on public.order_items;

create policy order_items_select_own_restaurant
on public.order_items
for select
to authenticated
using (
  restaurant_id in (
    select u.restaurant_id
    from public.users u
    where u.id = auth.uid()
      and u.restaurant_id is not null
  )
);

create policy order_items_write_own_restaurant
on public.order_items
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

-- 6) VERIFY: Check for data consistency (orders vs tables restaurant_id)
-- This should return 0 rows if data is clean
do $$
declare
  mismatch_count int;
begin
  select count(*)
  into mismatch_count
  from public.orders o
  join public.tables t on t.id = o.table_id
  where o.restaurant_id <> t.restaurant_id;
  
  if mismatch_count > 0 then
    raise warning 'Found % orders with mismatched restaurant_id (order.restaurant_id <> table.restaurant_id)', mismatch_count;
  else
    raise notice 'Data consistency check passed: all orders have matching restaurant_id';
  end if;
end
$$;

-- 7) VERIFY: Check menu_items consistency in order_items
do $$
declare
  mismatch_count int;
begin
  select count(*)
  into mismatch_count
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.menu_items mi on mi.id = oi.menu_item_id
  where o.restaurant_id <> mi.restaurant_id;
  
  if mismatch_count > 0 then
    raise warning 'Found % order_items with mismatched restaurant (order.restaurant_id <> menu_item.restaurant_id)', mismatch_count;
  else
    raise notice 'Menu consistency check passed: all order_items reference correct restaurant';
  end if;
end
$$;

commit;
