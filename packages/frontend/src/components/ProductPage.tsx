import { useParams } from "react-router-dom";

export function ProductDetailPage() {
  const { id } = useParams();

  return (
    <section className="page-card">
      <h1>Product Detail</h1>
      <p>Product detail page placeholder.</p>
      <p className="muted">productId: {id ?? "(missing)"}</p>
    </section>
  );
}
