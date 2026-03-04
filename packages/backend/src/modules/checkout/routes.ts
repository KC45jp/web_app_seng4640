import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/role";
import { checkout } from "./controller";

const checkoutRouter = Router();

checkoutRouter.post("/", requireAuth, requireRole(["customer"]), checkout);

export default checkoutRouter;
