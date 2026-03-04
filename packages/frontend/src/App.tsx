import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { NotFoundPage } from "@/components/NotFoundPage";
import { RequireRole } from "@/components/RequireRole";
import { CartPage, CheckoutPage, MyPage } from "@/components/CustomerPages";
import { HomePage } from "@/components/Main";
import { LoginPage, ManagerLoginPage, SignupPage, AdminLoginPage } from "@/components/AuthPages";
import {
  ManagerDashboardPage,
  ManagerNewProductPage,
  ManagerProductEditPage,
} from "@/components/PM";
import { AdminManagersPage } from "@/components/Admin";
import { ProductDetailPage } from "@/components/ProductPage";
import { SearchPage } from "@/components/Search";
import "@/App.css";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/products/:id", element: <ProductDetailPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/pm/login", element: <ManagerLoginPage /> },
      { path: "/admin/login", element: <AdminLoginPage /> },
      {
        element: <RequireRole roles={["customer"]} />,
        children: [
          { path: "/cart", element: <CartPage /> },
          { path: "/checkout", element: <CheckoutPage /> },
          { path: "/mypage", element: <MyPage /> },
        ],
      },
      {
        element: <RequireRole roles={["manager"]} />,
        children: [
          { path: "/pm/dashboard", element: <ManagerDashboardPage /> },
          { path: "/pm/products/new", element: <ManagerNewProductPage /> },
          { path: "/pm/products/:id", element: <ManagerProductEditPage /> },
        ],
      },
      {
        element: <RequireRole roles={["admin"]} />,
        children: [{ path: "/admin/managers", element: <AdminManagersPage /> }],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
