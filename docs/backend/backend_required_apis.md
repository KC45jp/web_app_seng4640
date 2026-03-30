# Backend Required APIs (from plan + requirements)

## 1) Auth / User

- `POST /api/auth/register` (Customer sign up only)
- `POST /api/auth/login` (Customer / Manager / Admin login)
- `GET /api/me`
- `PATCH /api/me`

## 2) Product (Guest can browse)

- `GET /api/products`
  - query examples: `q`, `category`, `minPrice`, `maxPrice`
  - keyword search parameter is `q` (canonical); do not use legacy aliases like `search` or `str`
  - sorting/pagination: `sortBy`, `sortOrder`, `page`, `limit`
  - response should be a lightweight product summary list for browse/search screens
- `GET /api/products/:id`
  - response may include full product detail fields needed by the detail screen

### Guest visibility rule

- Guest can browse product list/detail only.
- Guest must not see Flash Sale inventory count.
- Guest must not purchase (checkout/cart endpoints forbidden).
- Keep list/detail responses aligned with that rule when exposing public product data.

## 3) Cart (Customer only)

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`

### Cart API notes

- Cart mutations should return the updated cart payload so frontend can trust server state after add/update/remove.
- Cart storage uses MongoDB via Mongoose with one cart document per customer.
- Cart mutations may use document-level optimistic locking.
- If a cart mutation loses a concurrency check, return `409 Conflict`.

## 4) Checkout / Order (Customer only)

- `POST /api/checkout`
  - payment method: `credit_card` or `paypal` (request field required)
  - must use atomic stock update:
  - `findOneAndUpdate({ _id: id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })`
- `GET /api/orders`
- `GET /api/orders/:id`

### Order tracking response (recommended)

- include `status` and `timeline` fields in order response for tracking UI.

## 5) Admin APIs

### Product Manager only

- `GET /api/admin/products/mine` (PO dashboard: own products)
- `GET /api/admin/products/:id` (PO edit screen: own product detail)
- `POST /api/admin/products`: Post new item
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- - soft disable products: set `isActive = false` (recommended default)
- `PATCH /api/admin/products/:id/flash-sale`

## 6) Super Admin APIs
### Super Admin only (Manager account management)

- `POST /api/admin/managers`
- `DELETE /api/admin/managers/:id`
- `GET /api/admin/managers`

### Manager deletion policy (important)

- soft disable products: set `isActive = false` (recommended default)


### Super Admin product permissions

- Requirement does not explicitly require Super Admin to perform product CRUD.
- To keep responsibilities clean:
  - Product Manager handles day-to-day product operations.
  - Super Admin handles manager-account lifecycle.
- If needed, allow only emergency product actions for Super Admin (for example forced deactivation or ownership transfer), not regular product editing.

## 7) Image APIs

- `POST /api/images` (Manager only — upload product image)
  - Stores image in GridFS (see `docs/backend/gridfs-image-storage.md`)
  - Returns `UploadImageResult` (`imageId`, `url`)
- `GET /api/images/:id` (No auth — public image retrieval)
  - Streams image binary from GridFS with correct `Content-Type`

## 8) Authorization Rules Notes

- Auth should use JWT (`Authorization: Bearer <token>`), not API key.
- Customer can manage profile/cart and complete purchase.
- Product Manager can add/update/delete products and manage flash sale, but cannot create admin/manager accounts.
- Super Admin can create/delete/manage Product Manager accounts.
