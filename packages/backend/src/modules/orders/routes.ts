import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/role";
import { getOrderById, listOrders } from "./controller";

const ordersRouter = Router();

ordersRouter.get("/", requireAuth, requireRole(["customer"]), listOrders);
ordersRouter.get("/:id", requireAuth, requireRole(["customer"]), getOrderById);

export default ordersRouter;
