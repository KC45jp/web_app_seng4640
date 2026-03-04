import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/role";
import {
  createManager,
  createProduct,
  deleteManager,
  deleteProduct,
  listManagedProducts,
  listManagers,
  updateFlashSale,
  updateProduct,
} from "./controller";

const adminRouter = Router();

adminRouter.get(
  "/products",
  requireAuth,
  requireRole(["manager"]),
  listManagedProducts
);
adminRouter.post(
  "/products",
  requireAuth,
  requireRole(["manager"]),
  createProduct
);
adminRouter.patch(
  "/products/:id",
  requireAuth,
  requireRole(["manager"]),
  updateProduct
);
adminRouter.delete(
  "/products/:id",
  requireAuth,
  requireRole(["manager"]),
  deleteProduct
);
adminRouter.patch(
  "/products/:id/flash-sale",
  requireAuth,
  requireRole(["manager"]),
  updateFlashSale
);

adminRouter.post(
  "/managers",
  requireAuth,
  requireRole(["admin"]),
  createManager
);
adminRouter.delete(
  "/managers/:id",
  requireAuth,
  requireRole(["admin"]),
  deleteManager
);
adminRouter.get(
  "/managers",
  requireAuth,
  requireRole(["admin"]),
  listManagers
);

export default adminRouter;
