# Backend Required APIs

This document records the current backend surface area used by the frontend and
the project requirements.

## Auth / User

- `POST /api/auth/register`
  - Customer sign-up only
- `POST /api/auth/login`
  - Customer / Manager / Admin login
- `GET /api/me`
- `PATCH /api/me`

## Public Product APIs

- `GET /api/products`
  - Query params: `q`, `category`, `minPrice`, `maxPrice`, `sortBy`,
    `sortOrder`, `page`, `limit`
  - Returns active product summaries for browse/search screens
- `GET /api/products/:id`
  - Returns active product detail data
  - Current implementation includes fields such as `stock`,
    `descriptionImages`, and flash-sale timing data for the detail view

### Guest visibility rule

- Guests can browse product list/detail only.
- Guests must not purchase.
- Guest UI must not render flash-sale inventory counts even if the current
  detail payload contains stock-related fields.

## Cart APIs

Customer only:

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`

Notes:

- Cart mutations return the updated cart payload.
- Cart writes use document-level optimistic locking when needed.
- Cart conflicts should surface as `409 Conflict`.

## Checkout / Orders

Customer only:

- `POST /api/checkout`
  - Request field: `paymentMethod: "credit_card" | "paypal"`
  - Uses a MongoDB transaction plus conditional stock decrement
- `GET /api/orders`
- `GET /api/orders/:id`

Order responses include:

- `status`
- `timeline`
- `paymentMethod`

## Product Manager APIs

Manager only:

- `GET /api/admin/products/mine`
- `GET /api/admin/products`
  - Current alias of the same managed-product listing
- `GET /api/admin/products/:id`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `PATCH /api/admin/products/:id/flash-sale`

Current product create/update payloads are centered on:

- `name`
- `description`
- `price`
- `stock`
- `imageUrl`
- `category`
- `isFlashSale`

Soft-delete behavior is implemented as `isActive = false`.

## Super Admin APIs

Admin only:

- `GET /api/admin/managers`
- `POST /api/admin/managers`
- `DELETE /api/admin/managers/:id`

Scope note:

- Super Admin manages Product Manager accounts.
- Regular product CRUD remains manager-owned.

## Image APIs

- `POST /api/images`
  - Manager only
  - Stores images in GridFS
  - Returns `UploadImageResult`
- `GET /api/images/:id`
  - Public image retrieval
  - Streams the stored image with the correct `Content-Type`

See also:

- `doc/backend/gridfs-image-storage.md`
- `doc/backend/api-js-examples.md`

## Authorization Notes

- Auth uses JWT via `Authorization: Bearer <token>`.
- Customer can manage profile/cart and complete checkout.
- Product Manager can manage owned products and flash sales.
- Super Admin can manage Product Manager accounts.
