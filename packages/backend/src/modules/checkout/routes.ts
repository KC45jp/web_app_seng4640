import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { checkout } from "./controller";

const checkoutRouter = Router();

checkoutRouter.post("/", requireAuth, checkout);

export default checkoutRouter;
