# Backend Database Schema (MongoDB)

## Scope

This document describes the current MongoDB collections used by the backend
application and the backend DB scripts.

Primary references in code:

- `packages/backend/src/db/models/*.ts`
- `packages/backend/src/scripts/db/common.ts`
- `packages/backend/src/scripts/db/seedProducts.ts`
- `packages/backend/src/scripts/db/customerSeed.ts`
- `packages/backend/src/scripts/db/seedLoadTest.ts`
- `packages/backend/src/scripts/db/clean.ts`

Database selection is controlled by `MONGO_URI`.

## Collections

### `users`

Purpose: application users for authentication and authorization.

Fields:

- `_id`: `ObjectId`
- `name`: `string`
- `email`: `string` (unique, lowercase)
- `role`: `"customer" | "manager" | "admin"`
- `passwordHash`: `string`
- `createdAt`: `Date`
- `updatedAt`: `Date`

### `products`

Purpose: public catalog, manager-owned inventory, and flash-sale stock source.

Fields:

- `_id`: `ObjectId`
- `name`: `string`
- `description`: `string`
- `detailedDescription`: `string | null`
- `price`: `number`
- `flashSalePrice`: `number | null`
- `stock`: `number`
- `imageUrl`: `string`
- `descriptionImages`: `string[]`
- `category`: `string`
- `productOwnerId`: `ObjectId` (required manager owner)
- `specs.sizeCm`: `{ depth: number, width: number, height: number } | null`
- `specs.weightG`: `number | null`
- `specs.extra`: `Record<string, string | number | boolean | null>`
- `isFlashSale`: `boolean`
- `isActive`: `boolean`
- `flashSaleStartAt`: `Date | null`
- `flashSaleEndAt`: `Date | null`
- `createdAt`: `Date`
- `updatedAt`: `Date`

Notes:

- Seed products currently use uploaded GridFS image URLs or placeholder URLs.
- Public browse endpoints only return active products.

### `orders`

Purpose: completed checkout history.

Fields:

- `_id`: `ObjectId`
- `userId`: `ObjectId`
- `items[]`: embedded order items
- `items[].productId`: `ObjectId`
- `items[].name`: `string`
- `items[].price`: `number`
- `items[].quantity`: `number`
- `totalAmount`: `number`
- `paymentMethod`: `"credit_card" | "paypal"`
- `status`: `"placed" | "paid" | "shipped" | "completed" | "cancelled"`
- `createdAt`: `Date`
- `updatedAt`: `Date`

### `carts`

Purpose: per-customer shopping cart state.

Fields:

- `_id`: `ObjectId`
- `userId`: `ObjectId` (unique)
- `items[]`: embedded cart items
- `items[].productId`: `ObjectId`
- `items[].quantity`: `number`
- `createdAt`: `Date`
- `updatedAt`: `Date`
- `__v`: `number`

Notes:

- Checkout uses `__v` as a document-level optimistic concurrency guard when
  clearing the cart after a successful order transaction.

### GridFS bucket: `product-images`

Purpose: uploaded manager product images.

Collections created by GridFS:

- `product-images.files`
- `product-images.chunks`

Stored metadata includes:

- `contentType`
- `uploaderId`
- `width`
- `height`
- `originalName`

## Indexes

Defined by `packages/backend/src/scripts/db/common.ts` and model declarations:

- `users`: `{ email: 1 }` unique
- `products`: `{ name: "text", category: 1 }`
- `products`: `{ productOwnerId: 1 }`
- `products`: `{ isFlashSale: 1, flashSaleStartAt: 1, flashSaleEndAt: 1 }`
- `carts`: `{ userId: 1 }` unique
- `carts`: `{ "items.productId": 1 }`
- `orders`: `{ userId: 1, createdAt: -1 }`
- `orders`: `{ status: 1, createdAt: -1 }`

## Seed and Reset Commands

Run under `packages/backend`:

- `npm run db:seed:products:dev`
- `npm run db:seed:customer:dev`
- `npm run db:reset:standard:dev`
- `npm run db:seed:loadtest:dev`
- `npm run db:reset:loadtest:dev`
- `npm run db:clean:dev`

Staging equivalents:

- `npm run db:seed:products:stg`
- `npm run db:seed:customer:stg`
- `npm run db:reset:standard:stg`
- `npm run db:seed:loadtest:stg`
- `npm run db:reset:loadtest:stg`
- `npm run db:clean:stg`

## Notes

- Active docs live under `doc/`.
- Archived notes live under `.doc/`.
- `db/init/*.js` is legacy Docker-init context; the main seed/reset flow is now
  backend script driven.
