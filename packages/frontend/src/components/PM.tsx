import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  AdminCreateProductInput,
  AdminUpdateFlashSaleInput,
  AdminUpdateProductInput,
  Product,
  ProductDetail,
  UploadImageResult,
} from "@seng4640/shared";
import {
  createManagedProduct,
  deleteManagedProduct,
  fetchManagerProducts,
  getManagedProductById,
  updateManagedProduct,
  updateManagedProductFlashSale,
} from "@/api/admin";
import { uploadProductImage } from "@/api/images";
import { resolveImageUrl } from "@/api/search";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/utils/apiError";

type ProductFormValues = {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: string;
  stock: string;
};

type FlashSaleFormValues = {
  isFlashSale: boolean;
  flashSalePrice: string;
  flashSaleStartAt: string;
  flashSaleEndAt: string;
};

type ManagerProductSort = "newest" | "oldest" | "name" | "price-high" | "price-low";

type UploadedImageSummary = Pick<UploadImageResult, "imageId" | "url" | "width" | "height">;

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

function getDisplayPrice(product: Product | ProductDetail) {
  return product.isFlashSale && product.flashSalePrice != null
    ? product.flashSalePrice
    : product.price;
}

function buildManagerProductSearchText(product: Product) {
  return [
    product._id ?? "",
    product.name,
    product.description,
    product.category,
    product.isActive ? "active" : "inactive",
    product.isFlashSale ? "flash sale" : "regular sale",
  ]
    .join(" ")
    .toLowerCase();
}

function sortManagerProducts(products: Product[], sortBy: ManagerProductSort): Product[] {
  const items = [...products];

  items.sort((left, right) => {
    switch (sortBy) {
      case "oldest":
        return Date.parse(left.createdAt ?? "") - Date.parse(right.createdAt ?? "");
      case "name":
        return left.name.localeCompare(right.name);
      case "price-high":
        return getDisplayPrice(right) - getDisplayPrice(left);
      case "price-low":
        return getDisplayPrice(left) - getDisplayPrice(right);
      case "newest":
      default:
        return Date.parse(right.createdAt ?? "") - Date.parse(left.createdAt ?? "");
    }
  });

  return items;
}

function createEmptyProductForm(): ProductFormValues {
  return {
    name: "",
    description: "",
    category: "",
    imageUrl: "",
    price: "",
    stock: "",
  };
}

function createProductFormFromDetail(product: ProductDetail): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    imageUrl: product.imageUrl,
    price: String(product.price),
    stock: String(product.stock),
  };
}

function createFlashSaleFormFromDetail(product: ProductDetail): FlashSaleFormValues {
  return {
    isFlashSale: product.isFlashSale,
    flashSalePrice: product.flashSalePrice != null ? String(product.flashSalePrice) : "",
    flashSaleStartAt: toDateTimeInputValue(product.flashSaleStartAt),
    flashSaleEndAt: toDateTimeInputValue(product.flashSaleEndAt),
  };
}

function toDateTimeInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toOptionalIsoString(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function parseProductForm(values: ProductFormValues):
  | { input: AdminCreateProductInput; error: null }
  | { input: null; error: string } {
  const price = Number(values.price);
  const stock = Number(values.stock);

  if (!values.name.trim()) return { input: null, error: "Product name is required." };
  if (!values.description.trim()) return { input: null, error: "Description is required." };
  if (!values.category.trim()) return { input: null, error: "Category is required." };
  if (!values.imageUrl.trim()) return { input: null, error: "Image URL is required." };
  if (!Number.isFinite(price) || price < 0) return { input: null, error: "Price must be 0 or more." };
  if (!Number.isInteger(stock) || stock < 0) return { input: null, error: "Stock must be a whole number 0 or more." };

  return {
    input: {
      name: values.name.trim(),
      description: values.description.trim(),
      category: values.category.trim(),
      imageUrl: values.imageUrl.trim(),
      price,
      stock,
    },
    error: null,
  };
}

function parseFlashSaleForm(values: FlashSaleFormValues):
  | { input: AdminUpdateFlashSaleInput; error: null }
  | { input: null; error: string } {
  if (!values.isFlashSale) {
    return {
      input: {
        isFlashSale: false,
        flashSalePrice: null,
        flashSaleStartAt: null,
        flashSaleEndAt: null,
      },
      error: null,
    };
  }

  const flashSalePrice = Number(values.flashSalePrice);
  if (!Number.isFinite(flashSalePrice) || flashSalePrice < 0) {
    return { input: null, error: "Flash sale price must be 0 or more." };
  }

  const flashSaleStartAt = toOptionalIsoString(values.flashSaleStartAt);
  const flashSaleEndAt = toOptionalIsoString(values.flashSaleEndAt);

  if (flashSaleStartAt && flashSaleEndAt && flashSaleEndAt < flashSaleStartAt) {
    return { input: null, error: "Flash sale end must be later than start." };
  }

  return {
    input: {
      isFlashSale: true,
      flashSalePrice,
      flashSaleStartAt,
      flashSaleEndAt,
    },
    error: null,
  };
}

function ManagerImageField({
  imageUrl,
  disabled,
  isUploading,
  uploadError,
  uploadedImage,
  onImageUrlChange,
  onSelectNewFile,
  onUpload,
}: {
  imageUrl: string;
  disabled: boolean;
  isUploading: boolean;
  uploadError: string | null;
  uploadedImage: UploadedImageSummary | null;
  onImageUrlChange: (value: string) => void;
  onSelectNewFile: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const previewUrl = imageUrl.trim() ? resolveImageUrl(imageUrl.trim()) : null;

  return (
    <div className="manager-image-field">
      <div className="manager-field-header">
        <div>
          <span>Product Image</span>
          <p className="muted">Upload first to generate an image URL, or paste a URL manually.</p>
        </div>
        {uploadedImage ? (
          <p className="manager-upload-success">
            Uploaded {uploadedImage.width} x {uploadedImage.height}
          </p>
        ) : null}
      </div>

      <div className="manager-upload-controls">
        <input
          className="manager-file-input"
          type="file"
          accept="image/png,image/jpeg"
          disabled={disabled || isUploading}
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] ?? null);
            setLocalError(null);
            onSelectNewFile();
          }}
        />
        <button
          className="product-detail-secondary-link manager-upload-button"
          type="button"
          disabled={disabled || isUploading}
          onClick={async () => {
            if (!selectedFile) {
              setLocalError("Choose a PNG or JPEG image first.");
              return;
            }

            setLocalError(null);

            try {
              await onUpload(selectedFile);
              setSelectedFile(null);
            } catch {
              // Parent mutation state owns the actual error display.
            }
          }}
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>

      {selectedFile ? (
        <p className="muted">
          Selected: {selectedFile.name}. Click Upload Image to use it in the product form.
        </p>
      ) : null}
      {localError ? <p className="search-error">{localError}</p> : null}
      {uploadError ? <p className="search-error">{uploadError}</p> : null}

      <label className="manager-field manager-field-full">
        <span>Image URL</span>
        <input
          className="manager-input"
          value={imageUrl}
          disabled={disabled || isUploading}
          onChange={(event) => onImageUrlChange(event.target.value)}
        />
      </label>

      {previewUrl ? (
        <div className="manager-preview-card">
          <img src={previewUrl} alt="Product preview" className="manager-preview-image" />
          <div className="manager-preview-meta">
            <p className="manager-preview-label">Preview</p>
            <p className="manager-preview-url">{imageUrl}</p>
            {uploadedImage?.imageId ? <p className="muted">Image ID: {uploadedImage.imageId}</p> : null}
          </div>
        </div>
      ) : (
        <p className="muted">
          No image selected yet. Upload an image or paste an image URL to preview it here.
        </p>
      )}
    </div>
  );
}

function ManagerProductFormFields({
  values,
  disabled,
  onChange,
}: {
  values: ProductFormValues;
  disabled: boolean;
  onChange: (field: keyof ProductFormValues, value: string) => void;
}) {
  return (
    <div className="manager-form-grid">
      <label className="manager-field">
        <span>Name</span>
        <input
          className="manager-input"
          value={values.name}
          disabled={disabled}
          onChange={(event) => onChange("name", event.target.value)}
        />
      </label>

      <label className="manager-field">
        <span>Category</span>
        <input
          className="manager-input"
          value={values.category}
          disabled={disabled}
          onChange={(event) => onChange("category", event.target.value)}
        />
      </label>

      <label className="manager-field">
        <span>Price</span>
        <input
          className="manager-input"
          type="number"
          min="0"
          step="0.01"
          value={values.price}
          disabled={disabled}
          onChange={(event) => onChange("price", event.target.value)}
        />
      </label>

      <label className="manager-field">
        <span>Stock</span>
        <input
          className="manager-input"
          type="number"
          min="0"
          step="1"
          value={values.stock}
          disabled={disabled}
          onChange={(event) => onChange("stock", event.target.value)}
        />
      </label>

      <label className="manager-field manager-field-full">
        <span>Description</span>
        <textarea
          className="manager-textarea"
          value={values.description}
          rows={5}
          disabled={disabled}
          onChange={(event) => onChange("description", event.target.value)}
        />
      </label>
    </div>
  );
}

function ManagerProductListItem({ product }: { product: Product }) {
  return (
    <article className="manager-product-row">
      <div className="manager-product-row-main">
        <div className="manager-product-row-header">
          <div>
            <p className="product-card-category">{product.category}</p>
            <h2 className="manager-product-row-name">{product.name}</h2>
          </div>
          <div className="manager-badge-row">
            {product.isFlashSale ? <span className="product-flash-badge manager-inline-badge">Flash Sale</span> : null}
            <span className={`manager-status-badge ${product.isActive ? "is-live" : "is-inactive"}`}>
              {product.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <p className="manager-product-row-description">{product.description}</p>

        <div className="manager-product-row-meta">
          <p className="manager-product-row-meta-item">
            Price: <strong>{formatMoney(getDisplayPrice(product))}</strong>
          </p>
          {product.isFlashSale ? (
            <p className="manager-product-row-meta-item">
              Regular: <span className="product-original-price">{formatMoney(product.price)}</span>
            </p>
          ) : null}
          <p className="manager-product-row-meta-item">Created: {formatDate(product.createdAt)}</p>
          {product._id ? (
            <p className="manager-product-row-meta-item">ID: {product._id.slice(-8)}</p>
          ) : null}
        </div>
      </div>

      <div className="manager-product-row-actions">
        {product._id ? (
          <Link className="btn-primary cart-checkout-btn" to={`/pm/products/${product._id}`}>
            Edit Product
          </Link>
        ) : null}
        {product._id && product.isActive ? (
          <Link className="product-detail-secondary-link" to={`/products/${product._id}`}>
            Public Page
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function ManagerDashboardPage() {
  const token = useAuthStore((state) => state.token);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ManagerProductSort>("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [saleFilter, setSaleFilter] = useState<"all" | "flash" | "regular">("all");

  const {
    data: products = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["manager-products"],
    queryFn: () => fetchManagerProducts(token),
  });

  if (isPending) {
    return (
      <section className="page-card">
        <h1>Manager Dashboard</h1>
        <p>Loading...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="page-card">
        <h1>Manager Dashboard</h1>
        <p className="search-error">{getApiErrorMessage(error, "Failed to load products.")}</p>
      </section>
    );
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (statusFilter === "active" && !product.isActive) {
      return false;
    }

    if (statusFilter === "inactive" && product.isActive) {
      return false;
    }

    if (saleFilter === "flash" && !product.isFlashSale) {
      return false;
    }

    if (saleFilter === "regular" && product.isFlashSale) {
      return false;
    }

    if (normalizedQuery && !buildManagerProductSearchText(product).includes(normalizedQuery)) {
      return false;
    }

    return true;
  });

  const visibleProducts = sortManagerProducts(filteredProducts, sortBy);
  const activeCount = products.filter((product) => product.isActive).length;
  const flashSaleCount = products.filter((product) => product.isFlashSale).length;

  return (
    <div className="manager-page-layout">
      <section className="page-card manager-hero-card">
        <div className="manager-page-header">
          <div>
            <h1>Manager Dashboard</h1>
            <p>Search your catalog quickly, jump into editing, and create new products.</p>
          </div>
          <div className="button-row">
            <Link className="btn-primary cart-checkout-btn" to="/pm/products/new">
              New Product
            </Link>
          </div>
        </div>
      </section>

      {products.length === 0 ? (
        <section className="page-card manager-empty-card">
          <h2>No products yet</h2>
          <p>Create your first product to start building the catalog.</p>
          <Link className="btn-primary cart-shop-link" to="/pm/products/new">
            Create Product
          </Link>
        </section>
      ) : (
        <>
          <section className="manager-summary-grid">
            <div className="manager-summary-card">
              <span className="manager-summary-label">Total Products</span>
              <strong>{products.length}</strong>
            </div>
            <div className="manager-summary-card">
              <span className="manager-summary-label">Active Products</span>
              <strong>{activeCount}</strong>
            </div>
            <div className="manager-summary-card">
              <span className="manager-summary-label">Flash Sales</span>
              <strong>{flashSaleCount}</strong>
            </div>
          </section>

          <section className="page-card">
            <div className="manager-toolbar">
              <label className="mypage-filter">
                <span className="mypage-filter-label">Search</span>
                <input
                  className="mypage-input"
                  value={searchQuery}
                  placeholder="Search by name, category, description, or ID"
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>

              <label className="mypage-filter">
                <span className="mypage-filter-label">Status</span>
                <select
                  className="mypage-select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "all" | "active" | "inactive")
                  }
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <label className="mypage-filter">
                <span className="mypage-filter-label">Sale Type</span>
                <select
                  className="mypage-select"
                  value={saleFilter}
                  onChange={(event) =>
                    setSaleFilter(event.target.value as "all" | "flash" | "regular")
                  }
                >
                  <option value="all">All</option>
                  <option value="flash">Flash Sale</option>
                  <option value="regular">Regular</option>
                </select>
              </label>

              <label className="mypage-filter">
                <span className="mypage-filter-label">Sort By</span>
                <select
                  className="mypage-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as ManagerProductSort)}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
              </label>
            </div>

            <p className="muted manager-results-meta">
              Showing {visibleProducts.length} of {products.length} products.
            </p>
          </section>

          {visibleProducts.length === 0 ? (
            <section className="page-card manager-empty-card">
              <h2>No matching products</h2>
              <p>Try adjusting your search or filters, or create a new product.</p>
              <Link className="btn-primary cart-shop-link" to="/pm/products/new">
                Create Product
              </Link>
            </section>
          ) : (
            <section className="page-card manager-product-list">
              {visibleProducts.map((product) => (
                <ManagerProductListItem key={product._id ?? product.name} product={product} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function ManagerNewProductPage() {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ProductFormValues>(createEmptyProductForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImageSummary | null>(null);

  const imageUploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductImage(token, file),
    onSuccess: (result) => {
      setValues((current) => ({ ...current, imageUrl: result.url }));
      setUploadedImage(result);
      setFormError(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: AdminCreateProductInput) => createManagedProduct(token, input),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["manager-products"] });
      if (data.product._id) {
        navigate(`/pm/products/${data.product._id}`, { replace: true });
      } else {
        navigate("/pm/dashboard", { replace: true });
      }
    },
  });

  return (
    <div className="manager-editor-layout">
      <section className="page-card">
        <div className="manager-page-header">
          <div>
            <h1>New Product</h1>
            <p>Create the base product first, then configure flash sale in the edit screen.</p>
          </div>
          <Link to="/pm/dashboard" className="product-detail-secondary-link">
            Back to Dashboard
          </Link>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);

            const parsed = parseProductForm(values);
            if (!parsed.input) {
              setFormError(parsed.error);
              return;
            }

            createMutation.mutate(parsed.input);
          }}
        >
          <ManagerImageField
            imageUrl={values.imageUrl}
            disabled={createMutation.isPending}
            isUploading={imageUploadMutation.isPending}
            uploadError={
              imageUploadMutation.isError
                ? getApiErrorMessage(imageUploadMutation.error, "Failed to upload image.")
                : null
            }
            uploadedImage={uploadedImage}
            onSelectNewFile={() => imageUploadMutation.reset()}
            onUpload={async (file) => {
              await imageUploadMutation.mutateAsync(file);
            }}
            onImageUrlChange={(value) => {
              setValues((current) => ({ ...current, imageUrl: value }));
              setUploadedImage(null);
              setFormError(null);
              imageUploadMutation.reset();
            }}
          />

          <ManagerProductFormFields
            values={values}
            disabled={createMutation.isPending}
            onChange={(field, value) => {
              setValues((current) => ({ ...current, [field]: value }));
              if (formError) setFormError(null);
            }}
          />

          {formError ? <p className="search-error">{formError}</p> : null}
          {createMutation.isError ? (
            <p className="search-error">
              {getApiErrorMessage(createMutation.error, "Failed to create product.")}
            </p>
          ) : null}

          <div className="button-row">
            <button
              className="btn-primary"
              type="submit"
              disabled={createMutation.isPending || imageUploadMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Product"}
            </button>
            <Link to="/pm/dashboard" className="product-detail-secondary-link">
              Cancel
            </Link>
          </div>
        </form>
      </section>

      <aside className="page-card manager-help-card">
        <h2>Suggested flow</h2>
        <p>1. Upload an image to generate the product image URL.</p>
        <p>2. Fill in the product details and create the item.</p>
        <p>3. Configure flash sale settings on the edit page if needed.</p>
      </aside>
    </div>
  );
}

function ManagerProductEditScreen({
  productId,
  product,
  token,
}: {
  productId: string;
  product: ProductDetail;
  token: string | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [productSnapshot, setProductSnapshot] = useState<ProductDetail>(product);
  const [productValues, setProductValues] = useState<ProductFormValues>(() =>
    createProductFormFromDetail(product),
  );
  const [flashValues, setFlashValues] = useState<FlashSaleFormValues>(() =>
    createFlashSaleFormFromDetail(product),
  );
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [flashFormError, setFlashFormError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImageSummary | null>(null);

  const imageUploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductImage(token, file),
    onSuccess: (result) => {
      setProductValues((current) => ({ ...current, imageUrl: result.url }));
      setUploadedImage(result);
      setProductFormError(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: AdminUpdateProductInput) => updateManagedProduct(token, productId, input),
    onSuccess: async (data) => {
      queryClient.setQueryData(["manager-product", productId], data.product);
      setProductSnapshot(data.product);
      setProductValues(createProductFormFromDetail(data.product));
      setFlashValues(createFlashSaleFormFromDetail(data.product));
      setProductFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["manager-products"] });
      await queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });

  const flashSaleMutation = useMutation({
    mutationFn: (input: AdminUpdateFlashSaleInput) =>
      updateManagedProductFlashSale(token, productId, input),
    onSuccess: async (data) => {
      queryClient.setQueryData(["manager-product", productId], data.product);
      setProductSnapshot(data.product);
      setProductValues(createProductFormFromDetail(data.product));
      setFlashValues(createFlashSaleFormFromDetail(data.product));
      setFlashFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["manager-products"] });
      await queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteManagedProduct(token, productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["manager-products"] });
      await queryClient.invalidateQueries({ queryKey: ["product", productId] });
      navigate("/pm/dashboard", { replace: true });
    },
  });

  return (
    <div className="manager-editor-layout">
      <section className="page-card">
        <div className="manager-page-header">
          <div>
            <h1>{productSnapshot.name}</h1>
            <p>Update core product data and keep the dashboard in sync.</p>
          </div>
          <div className="button-row">
            <Link to="/pm/dashboard" className="product-detail-secondary-link">
              Back to Dashboard
            </Link>
            {productSnapshot._id && productSnapshot.isActive ? (
              <Link
                to={`/products/${productSnapshot._id}`}
                className="product-detail-secondary-link"
              >
                Public Page
              </Link>
            ) : null}
          </div>
        </div>

        <div className="manager-summary-grid">
          <div className="manager-summary-card">
            <span className="manager-summary-label">Status</span>
            <strong>{productSnapshot.isActive ? "Active" : "Inactive"}</strong>
          </div>
          <div className="manager-summary-card">
            <span className="manager-summary-label">Created</span>
            <strong>{formatDate(productSnapshot.createdAt)}</strong>
          </div>
          <div className="manager-summary-card">
            <span className="manager-summary-label">Current price</span>
            <strong>{formatMoney(getDisplayPrice(productSnapshot))}</strong>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setProductFormError(null);

            const parsed = parseProductForm(productValues);
            if (!parsed.input) {
              setProductFormError(parsed.error);
              return;
            }

            updateMutation.mutate(parsed.input);
          }}
        >
          <ManagerImageField
            imageUrl={productValues.imageUrl}
            disabled={updateMutation.isPending}
            isUploading={imageUploadMutation.isPending}
            uploadError={
              imageUploadMutation.isError
                ? getApiErrorMessage(imageUploadMutation.error, "Failed to upload image.")
                : null
            }
            uploadedImage={uploadedImage}
            onSelectNewFile={() => imageUploadMutation.reset()}
            onUpload={async (file) => {
              await imageUploadMutation.mutateAsync(file);
            }}
            onImageUrlChange={(value) => {
              setProductValues((current) => ({ ...current, imageUrl: value }));
              setUploadedImage(null);
              setProductFormError(null);
              imageUploadMutation.reset();
            }}
          />

          <h2 className="manager-section-title">Product Info</h2>
          <ManagerProductFormFields
            values={productValues}
            disabled={updateMutation.isPending}
            onChange={(field, value) => {
              setProductValues((current) => ({ ...current, [field]: value }));
              if (productFormError) setProductFormError(null);
            }}
          />

          {productFormError ? <p className="search-error">{productFormError}</p> : null}
          {updateMutation.isError ? (
            <p className="search-error">
              {getApiErrorMessage(updateMutation.error, "Failed to update product.")}
            </p>
          ) : null}

          <div className="button-row">
            <button
              className="btn-primary"
              type="submit"
              disabled={updateMutation.isPending || imageUploadMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </section>

      <aside className="manager-side-column">
        <section className="page-card">
          <h2 className="manager-section-title">Flash Sale</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setFlashFormError(null);

              const parsed = parseFlashSaleForm(flashValues);
              if (!parsed.input) {
                setFlashFormError(parsed.error);
                return;
              }

              flashSaleMutation.mutate(parsed.input);
            }}
          >
            <label className="manager-checkbox-row">
              <input
                type="checkbox"
                checked={flashValues.isFlashSale}
                disabled={flashSaleMutation.isPending}
                onChange={(event) =>
                  setFlashValues((current) => ({
                    ...current,
                    isFlashSale: event.target.checked,
                  }))
                }
              />
              <span>Enable flash sale</span>
            </label>

            <div className="manager-form-grid">
              <label className="manager-field">
                <span>Flash sale price</span>
                <input
                  className="manager-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={flashValues.flashSalePrice}
                  disabled={!flashValues.isFlashSale || flashSaleMutation.isPending}
                  onChange={(event) =>
                    setFlashValues((current) => ({
                      ...current,
                      flashSalePrice: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="manager-field">
                <span>Start at</span>
                <input
                  className="manager-input"
                  type="datetime-local"
                  value={flashValues.flashSaleStartAt}
                  disabled={!flashValues.isFlashSale || flashSaleMutation.isPending}
                  onChange={(event) =>
                    setFlashValues((current) => ({
                      ...current,
                      flashSaleStartAt: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="manager-field">
                <span>End at</span>
                <input
                  className="manager-input"
                  type="datetime-local"
                  value={flashValues.flashSaleEndAt}
                  disabled={!flashValues.isFlashSale || flashSaleMutation.isPending}
                  onChange={(event) =>
                    setFlashValues((current) => ({
                      ...current,
                      flashSaleEndAt: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            {flashFormError ? <p className="search-error">{flashFormError}</p> : null}
            {flashSaleMutation.isError ? (
              <p className="search-error">
                {getApiErrorMessage(flashSaleMutation.error, "Failed to update flash sale.")}
              </p>
            ) : null}

            <div className="button-row">
              <button className="btn-primary" type="submit" disabled={flashSaleMutation.isPending}>
                {flashSaleMutation.isPending ? "Updating..." : "Update Flash Sale"}
              </button>
            </div>
          </form>
        </section>

        <section className="page-card manager-help-card">
          <h2 className="manager-section-title">Danger Zone</h2>
          <p>Disabling a product keeps it in your dashboard but removes it from the public catalog.</p>
          {deleteMutation.isError ? (
            <p className="search-error">
              {getApiErrorMessage(deleteMutation.error, "Failed to disable product.")}
            </p>
          ) : null}
          <button
            className="manager-danger-button"
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => {
              const confirmed = window.confirm(
                "Disable this product? It will no longer appear in the public catalog.",
              );
              if (!confirmed) {
                return;
              }

              deleteMutation.mutate();
            }}
          >
            {deleteMutation.isPending ? "Disabling..." : "Disable Product"}
          </button>
        </section>
      </aside>
    </div>
  );
}

export function ManagerProductEditPage() {
  const { id } = useParams();
  const token = useAuthStore((state) => state.token);

  const {
    data: product,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["manager-product", id],
    queryFn: () => getManagedProductById(token, id!).then(({ product }) => product),
    enabled: Boolean(id),
  });

  if (isPending) {
    return (
      <section className="page-card">
        <h1>Manager Product Detail</h1>
        <p>Loading...</p>
      </section>
    );
  }

  if (isError || !product || !id) {
    return (
      <section className="page-card">
        <h1>Manager Product Detail</h1>
        <p className="search-error">{getApiErrorMessage(error, "Failed to load product.")}</p>
        <Link to="/pm/dashboard">Back to dashboard</Link>
      </section>
    );
  }

  return (
    <ManagerProductEditScreen
      key={product._id ?? id}
      productId={id}
      product={product}
      token={token}
    />
  );
}
