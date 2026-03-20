import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import type { ListProductsQuery, Product } from "@seng4640/shared";
import { listProducts, resolveImageUrl } from "@/api/search";

const CATEGORIES = ["apparel", "electronics", "home", "outdoor", "books"];

const SORT_OPTIONS: { value: NonNullable<ListProductsQuery["sortBy"]>; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price", label: "Price" },
  { value: "createdAt", label: "Newest" },
  { value: "name", label: "Name" },
];

const LIMIT = 12;

// ── 共通ラッパー ──────────────────────────────────────────

function FilterGroup({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="filter-group">
      <label className="filter-label" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

// ── フィルターサイドバー ──────────────────────────────────

type FilterValues = {
  category: string;
  minPrice: string;
  maxPrice: string;
  sortBy: NonNullable<ListProductsQuery["sortBy"]>;
  sortOrder: "asc" | "desc";
};

function SearchFilters({
  values,
  setParam,
}: {
  values: FilterValues;
  setParam: (key: string, value: string) => void;
}) {
  const { category, minPrice, maxPrice, sortBy, sortOrder } = values;

  return (
    <aside className="search-filters page-card">
      <h2 className="filter-heading">Filters</h2>

      <FilterGroup label="Category" htmlFor="filter-category">
        <select
          id="filter-category"
          className="filter-select"
          value={category}
          onChange={(e) => setParam("category", e.target.value)}
        >
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup label="Min Price ($)" htmlFor="filter-min">
        <input
          id="filter-min"
          type="number"
          min="0"
          step="0.01"
          className="filter-input"
          value={minPrice}
          placeholder="0"
          onChange={(e) => setParam("minPrice", e.target.value)}
        />
      </FilterGroup>

      <FilterGroup label="Max Price ($)" htmlFor="filter-max">
        <input
          id="filter-max"
          type="number"
          min="0"
          step="0.01"
          className="filter-input"
          value={maxPrice}
          placeholder="Any"
          onChange={(e) => setParam("maxPrice", e.target.value)}
        />
      </FilterGroup>

      <FilterGroup label="Sort by" htmlFor="filter-sort">
        <select
          id="filter-sort"
          className="filter-select"
          value={sortBy}
          onChange={(e) => setParam("sortBy", e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup label="Order" htmlFor="filter-order">
        <select
          id="filter-order"
          className="filter-select"
          value={sortOrder}
          onChange={(e) => setParam("sortOrder", e.target.value)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </FilterGroup>
    </aside>
  );
}

// ── 商品カード ────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const displayPrice = product.isFlashSale && product.flashSalePrice != null
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
        <p className="product-card-category">{product.category}</p>
        <p className="product-card-name">{product.name}</p>
        <p className="product-card-price">
          {product.isFlashSale && product.flashSalePrice != null && (
            <span className="product-original-price">${product.price.toFixed(2)}</span>
          )}
          <span className={product.isFlashSale ? "product-sale-price" : ""}>
            ${displayPrice.toFixed(2)}
          </span>
        </p>
      </div>
    </Link>
  );
}

// ── 検索結果 ──────────────────────────────────────────────

function SearchResults({
  q,
  products,
  total,
  page,
  totalPages,
  isPending,
  isError,
  setPage,
}: {
  q: string;
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  isPending: boolean;
  isError: boolean;
  setPage: (p: number) => void;
}) {
  return (
    <section className="search-results">
      <div className="search-results-header">
        <h1 className="search-results-title">
          {q ? `Results for "${q}"` : "All Products"}
        </h1>
        {!isPending && <span className="muted">{total} item{total !== 1 ? "s" : ""}</span>}
      </div>

      {isPending && <p className="search-status">Loading…</p>}
      {isError && <p className="search-status search-error">Failed to load products.</p>}
      {!isPending && !isError && products.length === 0 && (
        <p className="search-status muted">No products found.</p>
      )}

      {!isPending && !isError && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                type="button"
              >
                ← Prev
              </button>
              <span className="pagination-info">Page {page} / {totalPages}</span>
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                type="button"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── ページ本体 ────────────────────────────────────────────

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const sortBy = (searchParams.get("sortBy") ?? "relevance") as NonNullable<ListProductsQuery["sortBy"]>;
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const { data, isPending, isError } = useQuery({
    queryKey: ["products", q, category, minPrice, maxPrice, sortBy, sortOrder, page],
    queryFn: () => {
      const query: ListProductsQuery = { page, limit: LIMIT };
      if (q) query.q = q;
      if (category) query.category = category;
      if (minPrice !== "") query.minPrice = Number(minPrice);
      if (maxPrice !== "") query.maxPrice = Number(maxPrice);
      if (sortBy && sortBy !== "relevance") query.sortBy = sortBy;
      if (sortOrder) query.sortOrder = sortOrder;
      return listProducts(query);
    },
  });

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  function setPage(p: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  }

  return (
    <div className="search-layout">
      <SearchFilters values={{ category, minPrice, maxPrice, sortBy, sortOrder }} setParam={setParam} />
      <SearchResults
        q={q}
        products={products}
        total={total}
        page={page}
        totalPages={totalPages}
        isPending={isPending}
        isError={isError}
        setPage={setPage}
      />
    </div>
  );
}
