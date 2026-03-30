import { useDeferredValue, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { AuthResponseUser, CartItem, Order, PaymentMethod, ProductDetail } from "@seng4640/shared";
import { getCart } from "@/api/cart";
import { checkout as submitCheckout } from "@/api/checkout";
import { getMe } from "@/api/me";
import { listOrders } from "@/api/orders";
import { getProductById, resolveImageUrl } from "@/api/search";
import { OrderCard } from "@/components/OrderCard";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/utils/apiError";

function getDisplayPrice(product: ProductDetail) {
  return product.isFlashSale && product.flashSalePrice != null
    ? product.flashSalePrice
    : product.price;
}

function formatPaymentMethod(paymentMethod: PaymentMethod) {
  return paymentMethod === "credit_card" ? "Credit Card" : "PayPal";
}

function CheckoutReviewItem({
  item,
  product,
}: {
  item: CartItem;
  product: ProductDetail;
}) {
  const unitPrice = getDisplayPrice(product);

  return (
    <div className="checkout-review-item">
      <img
        src={resolveImageUrl(product.imageUrl)}
        alt={product.name}
        className="checkout-review-image"
      />
      <div className="checkout-review-info">
        <p className="checkout-review-name">{product.name}</p>
        <p className="muted">
          {item.quantity} x ${unitPrice.toFixed(2)}
        </p>
      </div>
      <p className="checkout-review-subtotal">
        ${(unitPrice * item.quantity).toFixed(2)}
      </p>
    </div>
  );
}

function CheckoutSuccess({ order }: { order: Order }) {
  return (
    <section className="page-card checkout-success-card">
      <h1>Order placed</h1>
      <p>
        Order {order._id ? `#${order._id}` : ""} was placed successfully on{" "}
        {new Date(order.createdAt ?? Date.now()).toLocaleString()}.
      </p>
      <div className="checkout-success-summary">
        <p>
          Payment method: <strong>{formatPaymentMethod(order.paymentMethod ?? "credit_card")}</strong>
        </p>
        <p>
          Total amount: <strong>${order.totalAmount.toFixed(2)}</strong>
        </p>
      </div>
      <div className="checkout-success-items">
        {order.items.map((item) => (
          <div key={item.productId} className="checkout-success-item">
            <div>
              <p className="checkout-review-name">{item.name}</p>
              <p className="muted">
                {item.quantity} x ${item.price.toFixed(2)}
              </p>
            </div>
            <p className="checkout-review-subtotal">
              ${(item.quantity * item.price).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <div className="button-row">
        <Link to="/search" className="btn-primary cart-checkout-btn">
          Continue shopping
        </Link>
        <Link to="/" className="product-detail-secondary-link">
          Back to Home
        </Link>
      </div>
    </section>
  );
}

export function CheckoutPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");

  const {
    data: cartData,
    isPending: cartPending,
    isError: cartIsError,
    error: cartError,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(token),
  });

  const items = cartData?.cart.items ?? [];

  const productQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ["product", item.productId],
      queryFn: () => getProductById(item.productId).then((response) => response.product),
      enabled: items.length > 0,
    })),
  });

  const products = productQueries.map((query) => query.data);
  const productDetailsPending = productQueries.some((query) => query.isPending);
  const hasUnavailableProducts = productQueries.some(
    (query) => query.isError || (!query.isPending && !query.data),
  );
  const previewTotal = items.reduce((sum, item, index) => {
    const product = products[index];
    if (!product) {
      return sum;
    }

    return sum + getDisplayPrice(product) * item.quantity;
  }, 0);

  const checkoutMutation = useMutation({
    mutationFn: () => submitCheckout(token, { paymentMethod }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  if (checkoutMutation.isSuccess) {
    return <CheckoutSuccess order={checkoutMutation.data.order} />;
  }

  if (cartPending) {
    return (
      <section className="page-card">
        <h1>Checkout</h1>
        <p>Loading...</p>
      </section>
    );
  }

  if (cartIsError) {
    return (
      <section className="page-card">
        <h1>Checkout</h1>
        <p className="search-error">{getApiErrorMessage(cartError, "Failed to load checkout data.")}</p>
        <Link to="/cart">Back to cart</Link>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="page-card">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link to="/search">Browse products</Link>
      </section>
    );
  }

  return (
    <div className="checkout-layout">
      <section className="page-card">
        <div className="checkout-header">
          <div>
            <h1>Checkout</h1>
            <p>Review your order and choose a payment method.</p>
          </div>
          <Link to="/cart" className="product-detail-secondary-link">
            Back to Cart
          </Link>
        </div>
        <div className="checkout-review-list">
          {items.map((item, index) =>
            productQueries[index]?.isPending ? (
              <div key={item.productId} className="checkout-review-item checkout-review-skeleton" />
            ) : productQueries[index]?.isError || !products[index] ? (
              <div key={item.productId} className="checkout-review-item">
                <div className="checkout-review-image checkout-review-image-placeholder" />
                <div className="checkout-review-info">
                  <p className="checkout-review-name">Unavailable product</p>
                  <p className="muted">Remove this item from the cart before checkout.</p>
                </div>
                <p className="checkout-review-subtotal">-</p>
              </div>
            ) : (
              <CheckoutReviewItem
                key={item.productId}
                item={item}
                product={products[index]!}
              />
            ),
          )}
        </div>
      </section>

      <aside className="page-card checkout-sidebar">
        <h2 className="checkout-sidebar-title">Payment</h2>
        <form
          className="checkout-form"
          onSubmit={(event) => {
            event.preventDefault();
            checkoutMutation.mutate();
          }}
        >
          <label className="checkout-payment-option">
            <input
              type="radio"
              name="payment-method"
              value="credit_card"
              checked={paymentMethod === "credit_card"}
              onChange={() => setPaymentMethod("credit_card")}
            />
            <span>Credit Card</span>
          </label>

          <label className="checkout-payment-option">
            <input
              type="radio"
              name="payment-method"
              value="paypal"
              checked={paymentMethod === "paypal"}
              onChange={() => setPaymentMethod("paypal")}
            />
            <span>PayPal</span>
          </label>

          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Items</span>
              <strong>{items.length}</strong>
            </div>
            <div className="checkout-total-row">
              <span>Total</span>
              <strong>${previewTotal.toFixed(2)}</strong>
            </div>
          </div>

          {hasUnavailableProducts ? (
            <p className="search-error">
              Some cart items could not be loaded. Please return to the cart and remove them.
            </p>
          ) : null}

          {checkoutMutation.isError ? (
            <p className="search-error">
              {getApiErrorMessage(checkoutMutation.error, "Checkout failed.")}
            </p>
          ) : null}

          <button
            className="btn-primary cart-checkout-btn"
            type="submit"
            disabled={checkoutMutation.isPending || productDetailsPending || hasUnavailableProducts}
          >
            {checkoutMutation.isPending ? "Placing order..." : "Place Order"}
          </button>
        </form>
      </aside>
    </div>
  );
}

export function MyPage() {
  const token = useAuthStore((state) => state.token);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const {
    data: meData,
    isPending: mePending,
    isError: meIsError,
    error: meError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token),
    enabled: Boolean(token),
  });

  const {
    data: ordersData,
    isPending: ordersPending,
    isError: ordersIsError,
    error: ordersError,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(token),
    enabled: Boolean(token),
  });

  if (!token) {
    return (
      <section className="page-card">
        <h1>My Page</h1>
        <p className="search-error">Your session has expired. Please log in again.</p>
        <Link to="/login">Back to Login</Link>
      </section>
    );
  }

  if (mePending || ordersPending) {
    return (
      <section className="page-card">
        <h1>My Page</h1>
        <p>Loading...</p>
      </section>
    );
  }

  if (meIsError || ordersIsError) {
    return (
      <section className="page-card">
        <h1>My Page</h1>
        <p className="search-error">
          {meIsError
            ? getApiErrorMessage(meError, "Failed to load profile.")
            : getApiErrorMessage(ordersError, "Failed to load orders.")}
        </p>
      </section>
    );
  }

  if (!meData || !ordersData) {
    return (
      <section className="page-card">
        <h1>My Page</h1>
        <p className="search-error">Profile data is temporarily unavailable.</p>
      </section>
    );
  }

  const user = meData.user;
  const orders = applyOrderSort(
    filterOrders(ordersData.items, deferredSearchTerm),
    sortBy,
  );
  const latestOrder = ordersData.items[0];

  return (
    <div className="mypage-layout">
      <ProfileSummary user={user} orderCount={ordersData.items.length} latestOrder={latestOrder} />

      <section className="page-card">
        <div className="mypage-orders-header">
          <div>
            <h1>My Orders</h1>
            <p>Search by order id, product name, status, or payment method.</p>
          </div>
          <Link to="/search" className="product-detail-secondary-link">
            Continue Shopping
          </Link>
        </div>

        <div className="mypage-toolbar">
          <label className="mypage-filter">
            <span className="mypage-filter-label">Search</span>
            <input
              className="mypage-input"
              type="search"
              value={searchTerm}
              placeholder="Search orders"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <label className="mypage-filter">
            <span className="mypage-filter-label">Sort</span>
            <select
              className="mypage-select"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "newest" | "oldest" | "highest" | "lowest")
              }
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest total</option>
              <option value="lowest">Lowest total</option>
            </select>
          </label>
        </div>

        <div className="mypage-results-meta">
          <p className="muted">
            Showing {orders.length} of {ordersData.items.length} orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="mypage-empty">
            {ordersData.items.length === 0 ? (
              <>
                <p>You have not placed any orders yet.</p>
                <Link to="/search" className="btn-primary cart-shop-link">
                  Browse products
                </Link>
              </>
            ) : (
              <p className="muted">No orders match your search.</p>
            )}
          </div>
        ) : (
          <div className="mypage-order-list">
            {orders.map((order) => (
              <OrderCard key={order._id ?? `${order.createdAt}-${order.totalAmount}`} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProfileSummary({
  user,
  orderCount,
  latestOrder,
}: {
  user: AuthResponseUser;
  orderCount: number;
  latestOrder?: Order;
}) {
  return (
    <section className="page-card mypage-profile-card">
      <p className="order-card-label">Profile</p>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <div className="mypage-profile-stats">
        <div className="mypage-stat-card">
          <span className="mypage-stat-label">Orders</span>
          <strong>{orderCount}</strong>
        </div>
        <div className="mypage-stat-card">
          <span className="mypage-stat-label">Latest order</span>
          <strong>
            {latestOrder?.createdAt
              ? new Date(latestOrder.createdAt).toLocaleDateString()
              : "No orders yet"}
          </strong>
        </div>
      </div>
    </section>
  );
}

function filterOrders(orders: Order[], searchTerm: string) {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) {
    return orders;
  }

  return orders.filter((order) => {
    const haystack = [
      order._id,
      order.status,
      order.paymentMethod,
      ...order.items.map((item) => item.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

function applyOrderSort(
  orders: Order[],
  sortBy: "newest" | "oldest" | "highest" | "lowest",
) {
  const next = [...orders];

  next.sort((a, b) => {
    if (sortBy === "highest") {
      return b.totalAmount - a.totalAmount;
    }

    if (sortBy === "lowest") {
      return a.totalAmount - b.totalAmount;
    }

    const left = new Date(a.createdAt ?? 0).getTime();
    const right = new Date(b.createdAt ?? 0).getTime();

    return sortBy === "oldest" ? left - right : right - left;
  });

  return next;
}
