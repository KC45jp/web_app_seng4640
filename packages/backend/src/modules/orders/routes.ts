import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { getOrderById, listOrders } from "./controller";

const ordersRouter = Router();

ordersRouter.get("/", requireAuth, listOrders);
ordersRouter.get("/:id", requireAuth, getOrderById);

export default ordersRouter;
