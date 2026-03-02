import type { Express } from "express";
import adminRouter from "../modules/admin/routes";
import authRouter from "../modules/auth/routes";
import cartRouter from "../modules/cart/routes";
import checkoutRouter from "../modules/checkout/routes";
import ordersRouter from "../modules/orders/routes";
import productsRouter from "../modules/products/routes";
import meRouter from "../modules/user/routes";

export function registerRoutes(app: Express): void {
  app.use("/api/auth", authRouter);
  app.use("/api/me", meRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/admin", adminRouter);
}
