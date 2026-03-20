import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import type { ProductDetail } from "@seng4640/shared";
import { getProductById, resolveImageUrl } from "@/api/search";
import { useAuthStore } from "@/store/authStore";
import { ROLE } from "@/constants/roles";

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
}: {
  isGuest: boolean;
  isCustomer: boolean;
}) {
  if (isCustomer) {
    return (
      <div className="button-row product-detail-actions">
        <button className="btn-primary" type="button">
          Add to Cart
        </button>
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
}: {
  product: ProductDetail;
  isGuest: boolean;
  isCustomer: boolean;
}) {
  const showStock = product.isFlashSale ? !isGuest : true;

  return (
    <div className="product-detail-info-col page-card">
      <p className="product-card-category">{product.category}</p>
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
      <ProductActions isGuest={isGuest} isCustomer={isCustomer} />
      <p className="muted product-detail-meta">
        Added: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
      </p>
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const role = useAuthStore((state) => state.role);

  const { data: product, isPending, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!).then(({ product }) => product),
    enabled: !!id,
  });

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

  return (
    <div className="product-detail-layout">
      <ProductImageGallery product={product} />
      <ProductInfoPanel
        product={product}
        isGuest={role === ROLE.GUEST}
        isCustomer={role === ROLE.CUSTOMER}
      />
    </div>
  );
}
