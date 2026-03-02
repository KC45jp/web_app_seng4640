import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { getMe, patchMe } from "./controller";

const meRouter = Router();

meRouter.get("/", requireAuth, getMe);
meRouter.patch("/", requireAuth, patchMe);

export default meRouter;
