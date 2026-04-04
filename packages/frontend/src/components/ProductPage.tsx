import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import * as shared from "@seng4640/shared";
import type { ProductDetail } from "@seng4640/shared";
import { addCartItem } from "@/api/cart";
import { getProductById, resolveImageUrl } from "@/api/search";
import { useAuthStore } from "@/store/authStore";
import { ROLE } from "@/constants/roles";
import { getApiErrorMessage } from "@/utils/apiError";

function ProductImageGallery({ product }: { product: ProductDetail }) {
  return (
    <div className="product-detail-image-col">
      <img
        src={resolveImageUrl(product.imageUrl)}
        alt={product.name}
        className="product-detail-image"
      />
      {product.descriptionImages && product.descriptionImages.length > 0 && (
        <div className="product-detail-sub-images">
          {product.descriptionImages.map((url, i) => (
            <img
              key={i}
              src={resolveImageUrl(url)}
              alt={`${product.name} image ${i + 1}`}
              className="product-detail-sub-image"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductPriceRow({ product }: { product: ProductDetail }) {
  const salePrice =
    product.isFlashSale && product.flashSalePrice != null
      ? product.flashSalePrice
      : null;

  return (
    <div className="product-detail-price-row">
      {salePrice !== null ? (
        <>
          <span className="product-flash-badge">Flash Sale</span>
          <span className="product-original-price">${product.price.toFixed(2)}</span>
          <span className="product-sale-price product-detail-price">
            ${salePrice.toFixed(2)}
          </span>
        </>
      ) : (
        <span className="product-detail-price">${product.price.toFixed(2)}</span>
      )}
    </div>
  );
}

function ProductStockInfo({
  product,
  showStock,
}: {
  product: ProductDetail;
  showStock: boolean;
}) {
  if (product.isFlashSale) {
    return showStock ? (
      <p className="product-detail-stock">
        In stock (flash sale): <strong>{product.stock}</strong>
      </p>
    ) : null;
  }
  return <p className="product-detail-stock muted">In stock: {product.stock}</p>;
}

function ProductActions({
  isGuest,
  isCustomer,
  quantity,
  maxQuantity,
  isAdding,
  feedback,
  disabled,
  onQuantityChange,
  onAddToCart,
}: {
  isGuest: boolean;
  isCustomer: boolean;
  quantity: number;
  maxQuantity: number;
  isAdding: boolean;
  disabled: boolean;
  feedback: { tone: "success" | "error"; message: string } | null;
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
}) {
  if (isCustomer) {
    return (
      <div className="product-detail-actions">
        <div className="product-quantity-block">
          <label className="product-quantity-label" htmlFor="product-quantity">
            Quantity
          </label>
          <div className="product-quantity-controls">
            <button
              className="cart-qty-btn"
              type="button"
              disabled={disabled || quantity <= 1}
              onClick={() => onQuantityChange(quantity - 1)}
            >
              −
            </button>
            <input
              id="product-quantity"
              className="product-quantity-input"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              disabled={disabled}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (!Number.isFinite(nextValue)) {
                  onQuantityChange(1);
                  return;
                }
                onQuantityChange(nextValue);
              }}
            />
            <button
              className="cart-qty-btn"
              type="button"
              disabled={disabled || quantity >= maxQuantity}
              onClick={() => onQuantityChange(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>
        <div className="button-row">
          <button
            className="btn-primary"
            type="button"
            disabled={disabled}
            onClick={onAddToCart}
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
          <Link className="product-detail-secondary-link" to="/cart">
            View Cart
          </Link>
        </div>
        {feedback ? (
          <p className={feedback.tone === "error" ? "search-error" : "product-detail-success"}>
            {feedback.message}
          </p>
        ) : null}
      </div>
    );
  }
  if (isGuest) {
    return (
      <p className="muted product-detail-login-hint">
        <Link to="/login">Log in</Link> or <Link to="/signup">sign up</Link> to purchase.
      </p>
    );
  }
  return null;
}

function ProductInfoPanel({
  product,
  isGuest,
  isCustomer,
  quantity,
  maxQuantity,
  isAdding,
  disabled,
  feedback,
  onQuantityChange,
  onAddToCart,
}: {
  product: ProductDetail;
  isGuest: boolean;
  isCustomer: boolean;
  quantity: number;
  maxQuantity: number;
  isAdding: boolean;
  disabled: boolean;
  feedback: { tone: "success" | "error"; message: string } | null;
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
}) {
  const showStock = product.isFlashSale ? !isGuest : true;

  return (
    <div className="product-detail-info-col page-card">
      <p className="product-card-category">{shared.getProductCategoryLabel(product.category)}</p>
      <h1 className="product-detail-name">{product.name}</h1>
      <ProductPriceRow product={product} />
      <ProductStockInfo product={product} showStock={showStock} />
      {product.isFlashSale && product.flashSaleEndAt && (
        <p className="muted product-detail-sale-end">
          Sale ends: {new Date(product.flashSaleEndAt).toLocaleString()}
        </p>
      )}
      <p className="product-detail-description">{product.description}</p>
      {product.detailedDescription && (
        <p className="product-detail-long-description">{product.detailedDescription}</p>
      )}
      <ProductActions
        isGuest={isGuest}
        isCustomer={isCustomer}
        quantity={quantity}
        maxQuantity={maxQuantity}
        isAdding={isAdding}
        disabled={disabled}
        feedback={feedback}
        onQuantityChange={onQuantityChange}
        onAddToCart={onAddToCart}
      />
      <p className="muted product-detail-meta">
        Added: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
      </p>
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const role = useAuthStore((state) => state.role);
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const { data: product, isPending, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!).then(({ product }) => product),
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: (nextQuantity: number) => {
      const productId = product?._id;
      if (!productId) {
        throw new Error("Product id is missing.");
      }

      return addCartItem(token, { productId, quantity: nextQuantity });
    },
    onSuccess: (data, nextQuantity) => {
      queryClient.setQueryData(["cart"], data);
      setFeedback({
        tone: "success",
        message: `${product?.name ?? "Item"} x${nextQuantity} added to cart.`,
      });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: getApiErrorMessage(error, "Failed to add item to cart."),
      });
    },
  });

  useEffect(() => {
    if (!product) {
      return;
    }

    setQuantity((current) => {
      if (product.stock <= 0) {
        return 1;
      }

      return Math.min(Math.max(1, current), product.stock);
    });
    setFeedback(null);
  }, [product]);

  if (isPending) {
    return (
      <section className="page-card">
        <p>Loading…</p>
      </section>
    );
  }

  if (isError || !product) {
    return (
      <section className="page-card">
        <p className="search-error">Product not found.</p>
        <Link to="/search">← Back to products</Link>
      </section>
    );
  }

  const maxQuantity = Math.max(product.stock, 1);
  const disablePurchase = addToCartMutation.isPending || product.stock <= 0 || !token;

  return (
    <div className="product-detail-layout">
      <ProductImageGallery product={product} />
      <ProductInfoPanel
        product={product}
        isGuest={role === ROLE.GUEST}
        isCustomer={role === ROLE.CUSTOMER}
        quantity={quantity}
        maxQuantity={maxQuantity}
        isAdding={addToCartMutation.isPending}
        disabled={disablePurchase}
        feedback={feedback}
        onQuantityChange={(value) => {
          const nextValue = Math.min(Math.max(1, value), maxQuantity);
          setQuantity(nextValue);
          if (feedback) {
            setFeedback(null);
          }
        }}
        onAddToCart={() => {
          setFeedback(null);
          addToCartMutation.mutate(quantity);
        }}
      />
    </div>
  );
}
