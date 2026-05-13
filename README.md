# Restaurant QR Ordering System - Backend

Backend NestJS pour un systeme de commande en restaurant via QR code.

## Stack

- Framework: NestJS (TypeScript)
- Base de donnees: PostgreSQL via Supabase
- Auth: Supabase Auth + JWT (pairing KDS)
- Realtime: Supabase Realtime (broadcast)
- Validation: class-validator + class-transformer
- Architecture: modulaire

## Structure

```text
src/
  modules/
    auth/
    pairing/
    restaurants/
    kitchen/
    staff/
    tables/
    menu/
    orders/
    order-items/
    realtime/
  common/
    dto/
  database/
  app.module.ts
  main.ts
```

## Variables d'environnement

Copier le fichier `.env.example` en `.env`:

```env
PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
KDS_JWT_SECRET=replace_with_a_strong_secret
KDS_JWT_EXPIRES_IN=12h
```

## Schema Supabase: pairing_codes

SQL de creation de la table:

```sql
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
```

Script equivalent disponible: `scripts/create-pairing-codes.sql`.

## Installation

```bash
npm install
```

## Lancement

```bash
npm run start:dev
```

Health check:

```http
GET /health
```

## Endpoints

### Menu

```http
GET    /menu/:restaurantId
POST   /menu
PATCH  /menu/:id
DELETE /menu/:id
```

### Tables

```http
GET    /tables/:restaurantId
POST   /tables
GET    /tables/id/:id
```

Note: les routes `GET /tables/:restaurantId` et `GET /tables/:id` entrent en collision dans NestJS, donc la route detail table utilise `GET /tables/id/:id`.

### Orders

```http
POST   /orders
GET    /orders/restaurant/:id?page=1&limit=20
GET    /orders/:id
PATCH  /orders/:id/status
```

### Pairing (KDS)

```http
POST   /pairing/generate
POST   /pairing/connect
DELETE /pairing/restaurant/:restaurantId
```

`POST /pairing/generate`

- Protege par JWT owner/staff
- Body:

```json
{
  "restaurantId": "uuid"
}
```

- Retour:

```json
{
  "code": "A7K9Q2",
  "expiresAt": "2026-05-05T10:35:00.000Z"
}
```

`POST /pairing/connect`

- Body:

```json
{
  "code": "A7K9Q2"
}
```

- Retour:

```json
{
  "restaurantId": "uuid",
  "token": "jwt_token"
}
```

Regles de securite:

- expiration stricte 5 minutes
- code usage unique (single-use)
- invalid attempts journalisees

## Exemple de creation de commande

```json
{
  "table_id": "uuid",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2
    }
  ]
}
```

## Logique metier appliquee

- Creation de `order`
- Creation des `order_items` avec le prix courant des `menu_items`
- Verification des disponibilites et du `restaurant_id`
- Notification realtime `order.created`
- Mise a jour de statut + notification `order.status.updated`
- Pagination des commandes par restaurant

## Tests

```bash
npm run test
npm run test:e2e
```
# backendresto
