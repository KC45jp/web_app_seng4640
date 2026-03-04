import { useSearchParams } from "react-router-dom";

export function SearchPage() {
  const [params] = useSearchParams();

  return (
    <section className="page-card">
      <h1>Search</h1>
      <p>Search result page placeholder.</p>
      <p className="muted">q: {params.get("q") ?? "(none)"}</p>
    </section>
  );
}
