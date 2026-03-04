import { useParams } from "react-router-dom";

export function ManagerDashboardPage() {
  return (
    <section className="page-card">
      <h1>Manager Dashboard</h1>
      <p>Owned products list page shell.</p>
    </section>
  );
}

export function ManagerNewProductPage() {
  return (
    <section className="page-card">
      <h1>New Product</h1>
      <p>Product creation page shell.</p>
    </section>
  );
}

export function ManagerProductEditPage() {
  const { id } = useParams();

  return (
    <section className="page-card">
      <h1>Manager Product Detail</h1>
      <p>Edit/delete/flash-sale setup page shell.</p>
      <p className="muted">productId: {id ?? "(missing)"}</p>
    </section>
  );
}
