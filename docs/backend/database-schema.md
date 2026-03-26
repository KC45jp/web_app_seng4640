# Backend Database Schema (MongoDB)

## Scope
This document describes the current MongoDB document structure used by backend scripts:
- `packages/backend/src/scripts/db/common.ts`
- `packages/backend/src/scripts/db/seed.ts`
- `packages/backend/src/scripts/db/seedDev.ts`
- `packages/backend/src/scripts/db/clean.ts`

Database name is controlled by `MONGO_URI` (for example `seng4640` in dev).

## Collections

### `users`
Purpose: application users for authentication and authorization.

Fields:
- `_id`: `ObjectId` (auto)
- `name`: `string`
- `email`: `string` (unique)
- `role`: `"customer" | "manager" | "admin"` 
- `passwordHash`: `string` (bcrypt hash)
- `createdAt`: `Date`
- `updatedAt`: `Date`

Example:
```json
{
  "_id": "ObjectId(...)",
  "name": "Dev Customer",
  "email": "customer@example.com",
  "role": "customer",
  "passwordHash": "$2b$10$...",
  "createdAt": "2026-03-02T00:00:00.000Z",
  "updatedAt": "2026-03-02T00:00:00.000Z"
}
```

### `products`
Purpose: product catalog and flash-sale stock source.

Fields:
- `_id`: `ObjectId` (auto)
- `name`: `string`
- `description`: `string`
- `detailedDescription`: `string | null`
- `price`: `number`
- `flashSalePrice`: `number | null`
- `stock`: `number`
- `imageUrl`: `string` (for frontend static images like `/images/p1.jpg`)
- `descriptionImages`: `string[]`
- `category`: `string`
- `productOwnerId`: `ObjectId | null`
- `specs`: object
  - `sizeCm`: `{ depth: number, width: number, height: number } | null` (D/W/H in cm)
  - `weightG`: `number | null` (integer grams)
  - `extra`: `Record<string, string | number | boolean | null>`
- `isFlashSale`: `boolean`
- `flashSaleStartAt`: `Date | null`
- `flashSaleEndAt`: `Date | null`
- `createdAt`: `Date`
- `updatedAt`: `Date`

Example:
```json
{
  "_id": "ObjectId(...)",
  "name": "Product 1",
  "description": "Development seed product 1 in apparel category.",
  "detailedDescription": "Detailed info for Product 1. Materials, care instructions, and usage notes.",
  "price": 11.74,
  "flashSalePrice": null,
  "stock": 13,
  "imageUrl": "/images/p1.jpg",
  "descriptionImages": ["/images/p1.jpg", "/images/p2.jpg"],
  "category": "apparel",
  "productOwnerId": null,
  "specs": {
    "sizeCm": null,
    "weightG": null,
    "extra": {}
  },
  "isFlashSale": false,
  "flashSaleStartAt": null,
  "flashSaleEndAt": null,
  "createdAt": "2026-03-02T00:00:00.000Z",
  "updatedAt": "2026-03-02T00:00:00.000Z"
}
```

### `orders`
Purpose: checkout history.

Fields:
- `_id`: `ObjectId` (auto)
- `userId`: `ObjectId` (`users._id`)
- `items`: array of order items
  - `productId`: `ObjectId` (`products._id`)
  - `name`: `string`
  - `price`: `number`
  - `quantity`: `number`
- `totalAmount`: `number`
- `status`: `string` (current seed uses `"placed"`)
- `seedKey`: `string` (seed-only helper key, optional)
- `createdAt`: `Date`
- `updatedAt`: `Date`

Example:
```json
{
  "_id": "ObjectId(...)",
  "userId": "ObjectId(...)",
  "items": [
    {
      "productId": "ObjectId(...)",
      "name": "Basic White T-Shirt",
      "price": 19.99,
      "quantity": 2
    }
  ],
  "totalAmount": 39.98,
  "status": "placed",
  "seedKey": "dev-order-001",
  "createdAt": "2026-03-02T00:00:00.000Z",
  "updatedAt": "2026-03-02T00:00:00.000Z"
}
```

### `carts`
Purpose: per-customer shopping cart state.

Fields:
- `_id`: `ObjectId` (auto)
- `userId`: `ObjectId` (`users._id`, unique)
- `items`: array of cart items
  - `productId`: `ObjectId` (`products._id`)
  - `quantity`: `number`
- `createdAt`: `Date`
- `updatedAt`: `Date`
- `__v`: `number` (Mongoose version key, used for document-level optimistic locking when needed)

Example:
```json
{
  "_id": "ObjectId(...)",
  "userId": "ObjectId(...)",
  "items": [
    {
      "productId": "ObjectId(...)",
      "quantity": 2
    }
  ],
  "createdAt": "2026-03-02T00:00:00.000Z",
  "updatedAt": "2026-03-02T00:00:00.000Z",
  "__v": 1
}
```

## Indexes
Defined in `common.ts`:
- `users`: `{ email: 1 }` with `{ unique: true }`
- `products`: `{ name: "text", category: 1 }`
- `products`: `{ productOwnerId: 1 }`
- `products`: `{ isFlashSale: 1, flashSaleStartAt: 1, flashSaleEndAt: 1 }`

## Seed and Clean Commands
Run under `packages/backend`:

- `APP_ENV=dev npm run db:seed`
  - Seeds 50 products (`Product 1..50`)
- `APP_ENV=dev npm run db:seed:dev`
  - Seeds dev users, sample products, and one sample order
- `APP_ENV=dev npm run db:clean`
  - Deletes all documents from `carts`, `orders`, `products`, and `users`
  - Deletes uploaded product image data from GridFS collections `product-images.files` and `product-images.chunks`
  - Collections and indexes remain

For staging:
- `APP_ENV=stg npm run db:seed`
- `APP_ENV=stg npm run db:seed:dev`
- `APP_ENV=stg npm run db:clean`

## Notes
- `.document/` is ignored by git in this repository, so persistent team docs should live under `docs/`.
- `db/init/*.js` exists for legacy Docker init scripts, but current flow is backend script driven.
- Cart writes are expected to use document-level optimistic locking rather than item-level locking.
