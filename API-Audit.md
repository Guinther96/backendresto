# API Audit — Backend NestJS

## Objectif
Ce document liste les endpoints exposés par le backend NestJS et les routes recommandées pour synchroniser le frontend Flutter.

## Routes canonique recommandées
- `GET /restaurants/:restaurantId/menu` : lecture du menu d’un restaurant.
- `POST /tables/resolve-qr` : résolution d’un QR code de table pour l’accès client.
- `GET /restaurants/me` : restaurant courant de l’utilisateur authentifié.
- `GET /orders/restaurant/me` : commandes du restaurant courant.

## Auth
### `POST /auth/register`
- Auth : non requise
- Body :
  ```json
  {
    "email": "owner@example.com",
    "password": "123456",
    "name": "Demo Restaurant",
    "phone": "+33123456789",
    "address": "1 rue test"
  }
  ```
- Response 201/200 :
  ```json
  {
    "message": "Registration successful",
    "restaurantId": "<uuid>"
  }
  ```

### `POST /auth/login`
- Auth : non requise
- Body :
  ```json
  {
    "email": "owner@example.com",
    "password": "123456"
  }
  ```
- Response 200 :
  ```json
  {
    "session": {
      "access_token": "<token>",
      "refresh_token": "<token>"
    },
    "user": {
      "id": "<uuid>",
      "email": "owner@example.com",
      "role": "owner",
      "restaurant_id": "<uuid>"
    },
    "restaurant": {}
  }
  ```

## Restaurants
### `GET /restaurants`
- Auth : JWT requis
- Response 200 :
  ```json
  {
    "id": "<uuid>",
    "name": "Demo Restaurant",
    "owner_id": "<uuid>",
    "phone": "+33123456789",
    "address": "1 rue test",
    "order_summary": {
      "total": 0
    }
  }
  ```

### `GET /restaurants/me`
- Auth : JWT requis
- Response 200 : même structure que `/restaurants`.

### `PUT /restaurants/me`
- Auth : JWT requis
- Body :
  ```json
  {
    "name": "New Name",
    "phone": "+33100000000",
    "address": "New address"
  }
  ```
- Response 200 : objet restaurant mis à jour.

### `GET /restaurants/:id`
- Auth : JWT requis
- Response 200 : objet restaurant.

### `GET /restaurants/:id/menu`
- Auth : non requis
- Response 200 : tableau d’éléments de menu.

## Menu
### `GET /menu`
- Auth : JWT requis
- Response 200 : tableau d’éléments de menu.

### `GET /menu/me`
- Auth : JWT requis
- Response 200 : tableau d’éléments de menu.

### `GET /menu/restaurant/:restaurantId`
- Auth : non requis
- Response 200 : tableau d’éléments de menu.

### `GET /menu/:restaurantId`
- Auth : non requis
- Response 200 : tableau d’éléments de menu.
- Note : route legacy; préférer `/restaurants/:restaurantId/menu`.

### `POST /menu`
- Auth : JWT requis
- Body :
  ```json
  {
    "name": "Burger",
    "price": 12.5,
    "category": "Burgers",
    "description": "Classic burger",
    "image_url": "https://...",
    "is_available": true
  }
  ```
- Response 201/200 : objet menu item créé.

### `PATCH /menu/:id`
- Auth : JWT requis
- Body : objet partiel de menu item.
- Response 200 : objet menu item mis à jour.

### `DELETE /menu/:id`
- Auth : JWT requis
- Response 200 : `{ "deleted": true }`

## Tables
### `GET /tables/:id`
- Auth : JWT requis
- Response 200 : objet table.

### `GET /tables/restaurant/me`
- Auth : JWT requis
- Response 200 : tableau de tables.

### `POST /tables`
- Auth : JWT requis
- Body :
  ```json
  {
    "number": 1,
    "capacity": 4
  }
  ```
- Response 201/200 : objet table créé avec `qr_code`.

### `POST /tables/resolve-qr`
- Auth : non requise
- Body :
  ```json
  {
    "qrCode": "<qr value>"
  }
  ```
- Response 200 : objet table + `qr_payload`.

## Orders
### `GET /orders`
- Auth : JWT requis
- Response 200 : tableau d’orders enrichies avec `items`.

### `POST /orders`
- Auth : non requise
- Body :
  ```json
  {
    "table_id": "<uuid>",
    "items": [
      {
        "menu_item_id": "<uuid>",
        "quantity": 2
      }
    ]
  }
  ```
- Response 201/200 : order créée avec `items`.

### `GET /orders/restaurant/me`
- Auth : JWT requis
- Response 200 : tableau d’orders.

### `GET /orders/restaurant/:id`
- Auth : JWT requis
- Response 200 :
  ```json
  {
    "data": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 0
    }
  }
  ```

### `GET /orders/:id`
- Auth : JWT requis
- Response 200 : order + items.

### `PATCH /orders/:id/status`
- Auth : JWT requis
- Body :
  ```json
  {
    "status": "EN_ATTENTE"
  }
  ```
- Response 200 : order mise à jour.

## Kitchen
### `GET /kitchen/orders/me`
- Auth : KDS JWT requis
- Response 200 : tableau d’orders.

### `PATCH /kitchen/orders/:id/status`
- Auth : KDS JWT requis
- Body : même DTO que orders.
- Response 200 : order mise à jour.

## Pairing
### `POST /pairing/generate`
- Auth : JWT requis
- Body :
  ```json
  {
    "restaurantId": "<uuid>"
  }
  ```
- Response 200 : `{ "code": "ABC123", "expiresAt": "<iso-date>" }`

### `POST /pairing/connect`
- Auth : non requise
- Body :
  ```json
  {
    "code": "ABC123"
  }
  ```
- Response 200 : `{ "restaurantId": "<uuid>", "token": "<kds-token>" }`

### `DELETE /pairing/restaurant/:restaurantId`
- Auth : JWT requis
- Response 200 : `{ "invalidated": 1, "restaurantId": "<uuid>" }`

## Staff
### `GET /staff`
- Auth : JWT requis
- Response 200 : tableau de staff.

### `POST /staff`
- Auth : JWT requis
- Body :
  ```json
  {
    "email": "staff@example.com"
  }
  ```
- Response 200/201 : user mis à jour.

### `DELETE /staff/:staffUserId`
- Auth : JWT requis
- Response 200 : succès sans body.

## Problèmes/dupes à corriger côté frontend
1. Remplacer les appels au menu legacy :
   - `GET /menu/:restaurantId` -> `GET /restaurants/:restaurantId/menu`
   - `GET /menu/restaurant/:restaurantId` -> `GET /restaurants/:restaurantId/menu`
2. Utiliser `POST /tables/resolve-qr` au lieu d’une ancienne route si le frontend appelait un endpoint non standard.
3. Vérifier que les champs JSON correspondent exactement :
   - `restaurant_id` vs `restaurantId`
   - `table_id` vs `tableId`
   - `menu_item_id` vs `menuItemId`
   - `order_id` vs `orderId`
4. Vérifier les UUID et IDs envoyés au backend :
   - `restaurantId`, `tableId`, `menuItemId`, `orderId` doivent être des UUID/strings valides.
5. Respecter les codes HTTP attendus :
   - 200 succès lecture / mise à jour
   - 201 création
   - 400 body invalide
   - 401 token absent/invalid
   - 403 accès non autorisé
   - 404 ressource introuvable
   - 500 erreur serveur

## Recommandations finales
- Conserver les routes actuelles pour compatibilité tant que le frontend n’a pas été migré.
- Utiliser les routes canonique ci-dessus dans le frontend Flutter.
- Ne pas changer les modèles de données tant que le backend ne le demande pas.
