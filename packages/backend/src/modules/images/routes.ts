import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/role";
import { getImageById, uploadImage } from "./controller";

const imagesRouter = Router();

imagesRouter.post("/", requireAuth, requireRole(["manager"]), uploadImage);
imagesRouter.get("/:id", getImageById);

export default imagesRouter;
