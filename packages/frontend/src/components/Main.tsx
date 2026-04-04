import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import * as shared from "@seng4640/shared";
import type { Product } from "@seng4640/shared";
import { listProducts, resolveImageUrl } from "@/api/search";

function ProductCard({ product }: { product: Product }) {
  const displayPrice =
    product.isFlashSale && product.flashSalePrice != null
      ? product.flashSalePrice
      : product.price;

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-card-image-wrap">
        <img
          src={resolveImageUrl(product.imageUrl)}
          alt={product.name}
          className="product-card-image"
          loading="lazy"
        />
        {product.isFlashSale && (
          <span className="product-flash-badge">Flash Sale</span>
        )}
      </div>
      <div className="product-card-body">
        <p className="product-card-category">{shared.getProductCategoryLabel(product.category)}</p>
        <p className="product-card-name">{product.name}</p>
        <p className="product-card-price">
          {product.isFlashSale && product.flashSalePrice != null && (
            <span className="product-original-price">
              ${product.price.toFixed(2)}
            </span>
          )}
          <span className={product.isFlashSale ? "product-sale-price" : ""}>
            ${displayPrice.toFixed(2)}
          </span>
        </p>
      </div>
    </Link>
  );
}

function ProductSection({
  title,
  products,
  loading,
  viewAllHref,
}: {
  title: string;
  products: Product[];
  loading: boolean;
  viewAllHref: string;
}) {
  return (
    <section className="home-section">
      <div className="home-section-header">
        <h2 className="home-section-title">{title}</h2>
        <Link to={viewAllHref} className="home-section-link">
          View all →
        </Link>
      </div>
      {loading ? (
        <p className="search-status">Loading…</p>
      ) : products.length === 0 ? (
        <p className="muted">No products available.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage() {
  const { data: flashSaleProducts = [], isPending: loadingFlash } = useQuery({
    queryKey: ["flashSale"],
    queryFn: () =>
      listProducts({ sortBy: "createdAt", sortOrder: "desc", limit: 50 }).then(
        ({ items }) => items.filter((p) => p.isFlashSale).slice(0, 8),
      ),
  });

  const { data: newArrivals = [], isPending: loadingNew } = useQuery({
    queryKey: ["newArrivals"],
    queryFn: () =>
      listProducts({ sortBy: "createdAt", sortOrder: "desc", limit: 8 }).then(
        ({ items }) => items,
      ),
  });

  return (
    <div>
      <ProductSection
        title="⚡ Flash Sale"
        products={flashSaleProducts}
        loading={loadingFlash}
        viewAllHref="/search?sortBy=createdAt&sortOrder=desc"
      />
      <ProductSection
        title="New Arrivals"
        products={newArrivals}
        loading={loadingNew}
        viewAllHref="/search?sortBy=createdAt&sortOrder=desc"
      />
    </div>
  );
}
