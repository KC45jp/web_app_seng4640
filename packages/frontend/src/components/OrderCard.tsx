import { useState } from "react";
import type { Order, OrderItem, OrderStatus, PaymentMethod } from "@seng4640/shared";

function formatOrderDate(value?: string) {
  if (!value) {
    return "Unknown date";
  }

  return new Date(value).toLocaleString();
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatStatusLabel(status: OrderStatus | string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPaymentMethod(paymentMethod?: PaymentMethod) {
  if (paymentMethod === "paypal") {
    return "PayPal";
  }

  if (paymentMethod === "credit_card") {
    return "Credit Card";
  }

  return "Not set";
}

function getItemCount(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function getPreviewNames(items: OrderItem[]) {
  const names = items.slice(0, 2).map((item) => item.name);
  const extraCount = items.length - names.length;

  if (extraCount <= 0) {
    return names.join(", ");
  }

  return `${names.join(", ")} +${extraCount} more`;
}

type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const orderId = order._id ?? "unknown";
  const shortOrderId = orderId.slice(-8);
  const itemCount = getItemCount(order.items);

  return (
    <article className="order-card page-card">
      <div className="order-card-header">
        <div>
          <p className="order-card-label">Order</p>
          <h2 className="order-card-id">#{shortOrderId}</h2>
          <p className="muted">{formatOrderDate(order.createdAt)}</p>
        </div>
        <div className="order-card-header-meta">
          <span className={`order-status-badge order-status-${String(order.status).toLowerCase()}`}>
            {formatStatusLabel(order.status)}
          </span>
          <p className="order-card-total">{formatMoney(order.totalAmount)}</p>
        </div>
      </div>

      <div className="order-card-summary">
        <p className="order-card-summary-line">
          <strong>{itemCount}</strong> item{itemCount !== 1 ? "s" : ""}
        </p>
        <p className="order-card-summary-line">{getPreviewNames(order.items)}</p>
        <p className="order-card-summary-line">{formatPaymentMethod(order.paymentMethod)}</p>
      </div>

      <button
        className="order-card-toggle"
        type="button"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Hide details" : "View details"}
      </button>

      {expanded ? (
        <div className="order-card-details">
          <section>
            <h3 className="order-card-section-title">Items</h3>
            <div className="order-card-items">
              {order.items.map((item) => (
                <div key={`${orderId}-${item.productId}`} className="order-card-item-row">
                  <div>
                    <p className="order-card-item-name">{item.name}</p>
                    <p className="muted">
                      {item.quantity} x {formatMoney(item.price)}
                    </p>
                  </div>
                  <p className="order-card-item-subtotal">
                    {formatMoney(item.quantity * item.price)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {order.timeline && order.timeline.length > 0 ? (
            <section>
              <h3 className="order-card-section-title">Timeline</h3>
              <div className="order-card-timeline">
                {order.timeline.map((entry) => (
                  <div
                    key={`${orderId}-${entry.status}-${entry.timestamp}`}
                    className="order-card-timeline-row"
                  >
                    <span className="order-card-timeline-status">
                      {formatStatusLabel(entry.status)}
                    </span>
                    <span className="muted">{formatOrderDate(entry.timestamp)}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
