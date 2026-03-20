import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { CartItem, ProductDetail } from "@seng4640/shared";
import { useAuthStore } from "@/store/authStore";
import { getCart, updateCartItem, removeCartItem } from "@/api/cart";
import { getProductById, resolveImageUrl } from "@/api/search";

// ── 空カート ──────────────────────────────────────────────

function CartEmpty() {
  return (
    <div className="cart-empty">
      <p className="muted">Your cart is empty.</p>
      <Link to="/search" className="btn-primary cart-shop-link">
        Browse products
      </Link>
    </div>
  );
}

// ── カートアイテム行 ──────────────────────────────────────

function CartItemRow({
  item,
  product,
  onUpdateQty,
  onRemove,
  isUpdating,
}: {
  item: CartItem;
  product: ProductDetail;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  isUpdating: boolean;
}) {
  const unitPrice =
    product.isFlashSale && product.flashSalePrice != null
      ? product.flashSalePrice
      : product.price;

  return (
    <div className="cart-item">
      <img
        src={resolveImageUrl(product.imageUrl)}
        alt={product.name}
        className="cart-item-image"
      />
      <div className="cart-item-info">
        <Link to={`/products/${item.productId}`} className="cart-item-name">
          {product.name}
        </Link>
        <p className="cart-item-unit-price">
          {product.isFlashSale && product.flashSalePrice != null && (
            <span className="product-original-price">${product.price.toFixed(2)}</span>
          )}
          <span className={product.isFlashSale ? "product-sale-price" : ""}>
            ${unitPrice.toFixed(2)}
          </span>
        </p>
      </div>
      <div className="cart-item-qty">
        <button
          className="cart-qty-btn"
          type="button"
          disabled={isUpdating || item.quantity <= 1}
          onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
        >
          −
        </button>
        <span className="cart-qty-value">{item.quantity}</span>
        <button
          className="cart-qty-btn"
          type="button"
          disabled={isUpdating}
          onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
        >
          +
        </button>
      </div>
      <p className="cart-item-subtotal">${(unitPrice * item.quantity).toFixed(2)}</p>
      <button
        className="cart-item-remove"
        type="button"
        disabled={isUpdating}
        onClick={() => onRemove(item.productId)}
      >
        ✕
      </button>
    </div>
  );
}

// ── 読み込み中のプレースホルダー行 ────────────────────────

function CartItemSkeleton() {
  return <div className="cart-item cart-item-skeleton" />;
}

// ── 合計・チェックアウト ──────────────────────────────────

function CartSummary({
  items,
  products,
}: {
  items: CartItem[];
  products: (ProductDetail | undefined)[];
}) {
  const total = items.reduce((sum, item, i) => {
    const product = products[i];
    if (!product) return sum;
    const unitPrice =
      product.isFlashSale && product.flashSalePrice != null
        ? product.flashSalePrice
        : product.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  return (
    <div className="cart-summary page-card">
      <p className="cart-summary-total">
        Total: <strong>${total.toFixed(2)}</strong>
      </p>
      <Link to="/checkout" className="btn-primary cart-checkout-btn">
        Proceed to Checkout
      </Link>
    </div>
  );
}

// ── ページ本体 ────────────────────────────────────────────

export function CartPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const { data: cartData, isPending: cartPending } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(token),
  });

  const items = cartData?.cart.items ?? [];

  const productQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ["product", item.productId],
      queryFn: () => getProductById(item.productId).then((r) => r.product),
      enabled: items.length > 0,
    })),
  });

  const products = productQueries.map((q) => q.data);
  const productsLoading = productQueries.some((q) => q.isPending);

  const updateMutation = useMutation({
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
      updateCartItem(token, productId, qty),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeCartItem(token, productId),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });

  const isUpdating = updateMutation.isPending || removeMutation.isPending;

  if (cartPending) {
    return (
      <section className="page-card">
        <p>Loading…</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="page-card">
        <h1 className="cart-title">Cart</h1>
        <CartEmpty />
      </section>
    );
  }

  return (
    <div className="cart-layout">
      <section className="cart-items page-card">
        <h1 className="cart-title">Cart</h1>
        {items.map((item, i) =>
          productsLoading || !products[i] ? (
            <CartItemSkeleton key={item.productId} />
          ) : (
            <CartItemRow
              key={item.productId}
              item={item}
              product={products[i]!}
              onUpdateQty={(productId, qty) =>
                updateMutation.mutate({ productId, qty })
              }
              onRemove={(productId) => removeMutation.mutate(productId)}
              isUpdating={isUpdating}
            />
          ),
        )}
      </section>
      <CartSummary items={items} products={products} />
    </div>
  );
}
