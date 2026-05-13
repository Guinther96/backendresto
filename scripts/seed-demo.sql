-- Demo seed data for baserest
-- Safe to re-run: updates existing demo rows when possible.

create extension if not exists pgcrypto;

with restaurant_upsert as (
  insert into restaurants (name)
  values ('Demo Bistro')
  on conflict do nothing
  returning id
),
restaurant_row as (
  select id from restaurant_upsert
  union all
  select id from restaurants where name = 'Demo Bistro' limit 1
),
table_upsert as (
  insert into tables (restaurant_id, number, qr_code)
  select id, 1, 'table:' || id::text || ':1'
  from restaurant_row
  on conflict (restaurant_id, number)
  do update set qr_code = excluded.qr_code
  returning id, restaurant_id
)
insert into menu_items (restaurant_id, name, price, category, is_available)
select r.id, 'Cheeseburger Maison', 12.50::numeric, 'Burgers', true
from restaurant_row r
where not exists (
  select 1
  from menu_items m
  where m.restaurant_id = r.id
    and m.name = 'Cheeseburger Maison'
);

insert into menu_items (restaurant_id, name, price, category, is_available)
select r.id, 'Salade Caesar', 9.00::numeric, 'Salades', true
from restaurant_row r
where not exists (
  select 1
  from menu_items m
  where m.restaurant_id = r.id
    and m.name = 'Salade Caesar'
);

-- Show created demo data
select id, name, created_at from restaurants where name = 'Demo Bistro';
select t.id, t.restaurant_id, t.number from tables t join restaurants r on r.id = t.restaurant_id where r.name = 'Demo Bistro';
select m.id, m.restaurant_id, m.name, m.price from menu_items m join restaurants r on r.id = m.restaurant_id where r.name = 'Demo Bistro' order by m.name;
