import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { CartItem, Order, PaymentMethod, ProductDetail } from "@seng4640/shared";
import { getCart } from "@/api/cart";
import { checkout as submitCheckout } from "@/api/checkout";
import { getProductById, resolveImageUrl } from "@/api/search";
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
  return (
    <section className="page-card">
      <h1>My Page</h1>
      <p>User profile and order history shell.</p>
    </section>
  );
}
