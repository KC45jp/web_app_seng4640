# Frontend Plan (Role-Based E-commerce UI)

## 1. Consistency Check Result

After comparing `final-project-requirements-ja.md` and `backend_required_apis.md`, your overall direction is consistent.
If you keep the following four rules fixed during implementation, there will be no conflicts.

- Treat "Product Owner" as "Product Manager (manager role)" throughout.
- Guests can only browse products. They cannot view `Flash Sale inventory counts`, use `Cart`, or use `Checkout`.
- `Cart / Checkout / My Page` require Customer login.
- Super Admin only manages Product Manager accounts (not regular product CRUD).

## 2. Shared UI (All Modes)

- Header left: search bar + search button
- Header right (not logged in): `Login` / `Sign up`
- Header right (Customer logged in): `My Page` / `Logout`
- Header right (Manager logged in): `Manager Dashboard` / `Logout`
- Header right (Admin logged in): `Admin Dashboard` / `Logout`

## 3. Page Structure and Routing

### Public / Guest

- `/` Main page (Flash Sale / new arrivals)
- `/search` Search results page (sort/filter UI, processing handled by backend)
- `/products/:id` Product details
- `/login` Login
- `/signup` Customer registration

### Customer Only

- `/cart` Cart
- `/checkout` Checkout
- `/mypage` User info + purchase history (including order tracking)

### Product Manager Only

- `/pm/login` Login (can be unified with `/login`)
- `/pm/dashboard` List of own products
- `/pm/products/new` Create new product
- `/pm/products/:id` Product details (edit/delete/flash sale settings)

### Super Admin Only

- `/admin/login` Login (can be unified with `/login`)
- `/admin/managers` Product Manager list/add/delete

## 4. API Mapping by Screen

- Main/Search/Product: `GET /api/products`, `GET /api/products/:id`
- Search sorting/pagination: send `sortBy`, `sortOrder`, `page`, `limit` as query params

### Customer APIs

- Profile: `GET /api/me`, `PATCH /api/me`
- Cart: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId`, `DELETE /api/cart/items/:productId`
- Checkout: `POST /api/checkout` (`paymentMethod: credit_card | paypal`)
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
- Flash Sale inventory display (Guest): hidden
- Flash Sale inventory display (logged-in users): visible (still within requirements)

## 6. Recommended Implementation Order

1. Shared header + routing + authentication/role guards
2. Main / Search / Product (browse pages)
3. Login / Sign up
4. Customer features (Cart, Checkout, MyPage)
5. Manager features (Dashboard, New Product, Product Edit)
6. Admin features (Manager management)
