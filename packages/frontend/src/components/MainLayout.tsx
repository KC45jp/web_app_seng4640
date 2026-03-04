import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";

export function MainLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
