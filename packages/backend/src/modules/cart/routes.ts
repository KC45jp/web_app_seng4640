import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./controller";

const cartRouter = Router();

cartRouter.get("/", requireAuth, getCart);
cartRouter.post("/items", requireAuth, addCartItem);
cartRouter.patch("/items/:productId", requireAuth, updateCartItem);
cartRouter.delete("/items/:productId", requireAuth, removeCartItem);

export default cartRouter;
