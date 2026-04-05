# Backend API JavaScript Examples

This document collects practical JavaScript examples for calling the current
backend API with `fetch`.

These examples are intended for browser code and modern Node.js environments
that already provide `fetch`, `Headers`, `FormData`, and `Blob`/`File`.

Canonical request/response types still live in:

- `packages/shared/src/types.ts`
- `packages/backend/src/modules/*/schema.ts`

## Shared Helper

```js
const API_BASE_URL = "http://localhost:5000";
let accessToken = null;

async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    body,
    token = accessToken,
    headers = {},
  } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? data.message
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}
```

Typical error JSON shape:

```json
{
  "message": "Unauthorized"
}
```

## Auth and Profile

### Register customer

```js
const registerResult = await apiFetch("/api/auth/register", {
  method: "POST",
  body: {
    name: "Alice Customer",
    email: "alice@example.com",
    password: "password123",
  },
});

console.log(registerResult.user);
console.log(registerResult.accessToken);
```

Example success response:

```json
{
  "user": {
    "id": "661111111111111111111111",
    "name": "Alice Customer",
    "email": "alice@example.com",
    "role": "customer"
  },
  "accessToken": "eyJ..."
}
```

### Login as customer, manager, or admin

```js
const loginResult = await apiFetch("/api/auth/login", {
  method: "POST",
  body: {
    email: "manager@example.com",
    password: "password123",
  },
});

accessToken = loginResult.accessToken;
console.log(loginResult.user.role); // "customer" | "manager" | "admin"
```

### Get current user

```js
const meResult = await apiFetch("/api/me");
console.log(meResult.user);
```

### Update current user

```js
const updatedMeResult = await apiFetch("/api/me", {
  method: "PATCH",
  body: {
    name: "Alice Updated",
    email: "alice.updated@example.com",
  },
});

console.log(updatedMeResult.user);
```

## Public Product APIs

### List products with filters

```js
const params = new URLSearchParams({
  category: "gpu",
  minPrice: "100",
  maxPrice: "1200",
  sortBy: "price",
  sortOrder: "asc",
  page: "1",
  limit: "12",
});

const listProductsResult = await apiFetch(`/api/products?${params.toString()}`);

console.log(listProductsResult.items);
console.log(listProductsResult.total);
```

Example success response:

```json
{
  "items": [
    {
      "_id": "661111111111111111111112",
      "name": "RTX Example",
      "description": "Short summary",
      "price": 799.99,
      "flashSalePrice": null,
      "category": "gpu",
      "imageUrl": "/api/images/661111111111111111111150",
      "isFlashSale": false,
      "isActive": true,
      "createdAt": "2026-04-05T18:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 12
}
```

### Get one product by id

```js
const productId = "661111111111111111111112";
const productDetailResult = await apiFetch(`/api/products/${productId}`);

console.log(productDetailResult.product);
```

The detail response includes fields such as `stock`, `descriptionImages`,
`flashSaleStartAt`, and `flashSaleEndAt`.

## Cart, Checkout, and Orders

These routes require a customer token.

### Get cart

```js
const cartResult = await apiFetch("/api/cart");
console.log(cartResult.cart);
```

### Add item to cart

```js
const addCartItemResult = await apiFetch("/api/cart/items", {
  method: "POST",
  body: {
    productId: "661111111111111111111112",
    quantity: 2,
  },
});

console.log(addCartItemResult.cart.items);
```

### Update cart item quantity

```js
const productId = "661111111111111111111112";

const updateCartItemResult = await apiFetch(`/api/cart/items/${productId}`, {
  method: "PATCH",
  body: {
    quantity: 3,
  },
});

console.log(updateCartItemResult.cart.items);
```

Note: the current implementation treats `quantity: 0` as item removal. If you
want that intent to be explicit in client code, `DELETE /api/cart/items/:productId`
is also available.

### Remove cart item

```js
const productId = "661111111111111111111112";

const removeCartItemResult = await apiFetch(`/api/cart/items/${productId}`, {
  method: "DELETE",
});

console.log(removeCartItemResult.cart.items);
```

### Checkout

```js
const checkoutResult = await apiFetch("/api/checkout", {
  method: "POST",
  body: {
    paymentMethod: "credit_card",
  },
});

console.log(checkoutResult.order);
```

Example success response:

```json
{
  "order": {
    "_id": "661111111111111111111180",
    "userId": "661111111111111111111111",
    "items": [
      {
        "productId": "661111111111111111111112",
        "name": "RTX Example",
        "price": 799.99,
        "quantity": 1
      }
    ],
    "totalAmount": 799.99,
    "status": "placed",
    "paymentMethod": "credit_card",
    "timeline": [
      {
        "status": "placed",
        "timestamp": "2026-04-05T18:30:00.000Z"
      }
    ],
    "createdAt": "2026-04-05T18:30:00.000Z",
    "updatedAt": "2026-04-05T18:30:00.000Z"
  }
}
```

### List orders

```js
const listOrdersResult = await apiFetch("/api/orders");
console.log(listOrdersResult.items);
```

### Get one order

```js
const orderId = "661111111111111111111180";
const getOrderResult = await apiFetch(`/api/orders/${orderId}`);

console.log(getOrderResult.order);
```

## Product Manager APIs

These routes require a manager token. Managers still log in through the normal
`POST /api/auth/login` endpoint.

### Upload a product image

`POST /api/images` expects `multipart/form-data` with a single file field named
`image`.

Current implementation accepts JPEG and PNG uploads and rejects input files
larger than `5 MB`.

```js
const formData = new FormData();
formData.append("image", fileInput.files[0]);

const uploadResult = await apiFetch("/api/images", {
  method: "POST",
  body: formData,
});

console.log(uploadResult);
console.log(uploadResult.url); // e.g. "/api/images/661111111111111111111150"
```

Example success response:

```json
{
  "fileId": "661111111111111111111150",
  "imageId": "661111111111111111111150",
  "url": "/api/images/661111111111111111111150",
  "contentType": "image/jpeg",
  "width": 640,
  "height": 480
}
```

### List my managed products

```js
const managedProductsResult = await apiFetch("/api/admin/products/mine");
console.log(managedProductsResult.items);
```

`GET /api/admin/products` is currently an alias of the same listing.

### Get one managed product

```js
const productId = "661111111111111111111112";
const managedProductResult = await apiFetch(`/api/admin/products/${productId}`);

console.log(managedProductResult.product);
```

### Create product

```js
const createProductResult = await apiFetch("/api/admin/products", {
  method: "POST",
  body: {
    name: "Example GPU",
    description: "Short storefront summary",
    price: 799.99,
    stock: 20,
    imageUrl: "/api/images/661111111111111111111150",
    category: "gpu",
    isFlashSale: false,
  },
});

console.log(createProductResult.product);
```

### Update product

```js
const productId = "661111111111111111111112";

const updateProductResult = await apiFetch(`/api/admin/products/${productId}`, {
  method: "PATCH",
  body: {
    price: 749.99,
    stock: 25,
    description: "Updated storefront summary",
  },
});

console.log(updateProductResult.product);
```

### Enable or update flash sale

Date strings in ISO 8601 format work well here.

```js
const productId = "661111111111111111111112";

const flashSaleResult = await apiFetch(
  `/api/admin/products/${productId}/flash-sale`,
  {
    method: "PATCH",
    body: {
      isFlashSale: true,
      flashSalePrice: 699.99,
      flashSaleStartAt: "2026-04-06T17:00:00.000Z",
      flashSaleEndAt: "2026-04-06T19:00:00.000Z",
    },
  }
);

console.log(flashSaleResult.product);
```

To disable the flash sale:

```js
await apiFetch(`/api/admin/products/${productId}/flash-sale`, {
  method: "PATCH",
  body: {
    isFlashSale: false,
  },
});
```

### Delete product

This is a soft delete. The backend sets `isActive` to `false`.

```js
const productId = "661111111111111111111112";

const deleteProductResult = await apiFetch(`/api/admin/products/${productId}`, {
  method: "DELETE",
});

console.log(deleteProductResult.product.isActive); // false
```

## Super Admin APIs

These routes require an admin token.

### List managers

```js
const listManagersResult = await apiFetch("/api/admin/managers");
console.log(listManagersResult.items);
```

Example success response:

```json
{
  "items": [
    {
      "id": "661111111111111111111190",
      "name": "Pat Manager",
      "email": "manager@example.com",
      "role": "manager"
    }
  ]
}
```

### Create manager

```js
const createManagerResult = await apiFetch("/api/admin/managers", {
  method: "POST",
  body: {
    name: "New Manager",
    email: "new.manager@example.com",
    password: "password123",
  },
});

console.log(createManagerResult.manager);
```

### Delete manager

Deleting a manager also soft-disables that manager's products.

```js
const managerId = "661111111111111111111190";

const deleteManagerResult = await apiFetch(`/api/admin/managers/${managerId}`, {
  method: "DELETE",
});

console.log(deleteManagerResult.managerId);
```

## Image Retrieval

`GET /api/images/:id` returns image bytes, not JSON.

Use the returned URL directly in markup:

```js
const imageUrl = `${API_BASE_URL}/api/images/661111111111111111111150`;
document.querySelector("#product-image").src = imageUrl;
```

Or fetch it as a blob:

```js
const response = await fetch(`${API_BASE_URL}/api/images/661111111111111111111150`);
const blob = await response.blob();
console.log(blob.type);
```

## Notes

- Customer-only routes: `/api/cart`, `/api/checkout`, `/api/orders`
- Manager-only routes: `/api/images`, `/api/admin/products*`
- Admin-only routes: `/api/admin/managers*`
- Auth token format: `Authorization: Bearer <token>`
- Validation and exact TypeScript contracts are defined in:
  - `packages/shared/src/types.ts`
  - `packages/backend/src/modules/*/schema.ts`
