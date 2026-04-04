# Checkout Concurrency Notes

This note summarizes the current flash-sale checkout protection strategy used by
the backend.

## Current Strategy

The checkout flow combines four safeguards:

1. MongoDB transaction per checkout attempt
2. Conditional stock decrement with `stock: { $gte: quantity }`
3. Cart version check using `__v` when clearing the cart
4. Retry loop for transient MongoDB transaction conflicts

## What Happens During Checkout

At a high level:

1. Load the customer cart inside a MongoDB session
2. For each cart item, decrement stock only if enough stock remains
3. Build and create the order inside the same transaction
4. Clear the cart only if the cart version still matches
5. Retry transient conflicts up to five attempts

## Why This Prevents Oversell

The stock update only succeeds when the product document still has enough stock
for the requested quantity. If another request has already consumed the stock,
the update returns no matching document and checkout fails with
`409 Insufficient stock` instead of overselling.

## Why The Cart Version Check Exists

Even if stock reservation succeeds, the cart is only cleared when the cart
document version still matches the one read at the start of the transaction.
That prevents checkout from silently discarding cart changes made by another
request.

## Retry Behavior

The backend retries transient MongoDB write conflicts up to five times with a
small backoff. If conflicts keep happening, checkout returns:

- `409 Checkout conflicted with another request. Please retry`

This is primarily relevant under flash-sale contention when many requests are
trying to update the same product at nearly the same time.

## Related Files

- `packages/backend/src/modules/checkout/service.ts`
- `packages/backend/src/modules/checkout/service.test.ts`
- `packages/backend/src/db/models/cart.models.ts`
- `packages/backend/src/db/models/order.models.ts`
- `packages/backend/src/db/models/product.models.ts`
