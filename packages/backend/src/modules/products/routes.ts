import { Router } from "express";
import { getProductById, listProducts } from "./controller";

const productsRouter = Router();

productsRouter.get("/", listProducts);
productsRouter.get("/:id", getProductById);

export default productsRouter;
