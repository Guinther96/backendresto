create extension if not exists "uuid-ossp";

create table if not exists pairing_codes (
  id uuid primary key default uuid_generate_v4(),
  code varchar(6) not null unique,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  expires_at timestamp not null,
  used boolean not null default false,
  created_at timestamp not null default now()
);

create index if not exists idx_pairing_codes_restaurant_id on pairing_codes(restaurant_id);
create index if not exists idx_pairing_codes_expires_at on pairing_codes(expires_at);
