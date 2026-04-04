# Frontend Plan (Role-Based E-commerce UI)

This document is kept as the frontend scope and routing reference that guided
implementation.

## 1. Consistency Check Result

After comparing the final project requirements and
`doc/backend/backend_required_apis.md`, the overall direction is consistent.
If the following four rules stay fixed, there should be no role or routing
conflicts.

- Treat "Product Owner" as "Product Manager (manager role)" throughout.
- Guests can only browse products. They cannot view flash-sale inventory
  counts, use cart, or use checkout.
- `Cart / Checkout / My Page` require Customer login.
- Super Admin only manages Product Manager accounts.

## 2. Shared UI (All Modes)

- Header left: search bar + search button
- Header right (not logged in): `Login` / `Sign up`
- Header right (Customer logged in): `My Page` / `Logout`
- Header right (Manager logged in): `Manager Dashboard` / `Logout`
- Header right (Admin logged in): `Admin Dashboard` / `Logout`

## 3. Page Structure and Routing

### Public / Guest

- `/` Main page
- `/search` Search results page
- `/products/:id` Product details
- `/login` Login
- `/signup` Customer registration

### Customer Only

- `/cart` Cart
- `/checkout` Checkout
- `/mypage` User info + purchase history

### Product Manager Only

- `/pm/login` Login
- `/pm/dashboard` List of own products
- `/pm/products/new` Create new product
- `/pm/products/:id` Product details / edit / flash-sale settings

### Super Admin Only

- `/admin/login` Login
- `/admin/managers` Product Manager list / add / delete

## 4. API Mapping by Screen

- Main/Search/Product: `GET /api/products`, `GET /api/products/:id`
- Search sorting/pagination: `sortBy`, `sortOrder`, `page`, `limit`

### Customer APIs

- Profile: `GET /api/me`, `PATCH /api/me`
- Cart: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId`, `DELETE /api/cart/items/:productId`
- Checkout: `POST /api/checkout`
- Orders: `GET /api/orders`, `GET /api/orders/:id`

### Product Manager APIs

- `GET /api/admin/products/mine`
- `GET /api/admin/products/:id`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `PATCH /api/admin/products/:id/flash-sale`

### Super Admin APIs

- `GET /api/admin/managers`
- `POST /api/admin/managers`
- `DELETE /api/admin/managers/:id`

## 5. Frontend Implementation Rules

- Authentication: store JWT and include `Authorization: Bearer <token>`
- Route guard (Guest): browse-only pages
- Route guard (Customer): allow `cart/checkout/mypage`
- Route guard (Manager): allow `pm/*`
- Route guard (Admin): allow `admin/*`
- Flash-sale inventory display (Guest): hidden
- Flash-sale inventory display (logged-in users): visible when the product
  experience needs it

## 6. Original Recommended Implementation Order

1. Shared header + routing + authentication/role guards
2. Main / Search / Product
3. Login / Sign up
4. Customer features
5. Manager features
6. Admin features
