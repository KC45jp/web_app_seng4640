import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/role";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./controller";

const cartRouter = Router();

cartRouter.get("/", requireAuth, requireRole(["customer"]), getCart);
cartRouter.post("/items", requireAuth, requireRole(["customer"]), addCartItem);
cartRouter.patch(
  "/items/:productId",
  requireAuth,
  requireRole(["customer"]),
  updateCartItem
);
cartRouter.delete(
  "/items/:productId",
  requireAuth,
  requireRole(["customer"]),
  removeCartItem
);

export default cartRouter;
