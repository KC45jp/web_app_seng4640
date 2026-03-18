import type { Request, Response } from "express";

import {
  createManager as createManagerService,
  createProduct as createProductService,
  deleteManager as deleteManagerService,
  deleteProduct as deleteProductService,
  listManagedProducts as listManagedProductsService,
  listManagers as listManagersService,
  updateFlashSale as updateFlashSaleService,
  updateProduct as updateProductService,
} from "./service";
import {
  adminCreateManagerSchema,
  adminCreateProductSchema,
  adminUpdateFlashSaleSchema,
  adminUpdateProductSchema,
} from "./schema";
import { validateOrRespond } from "../../utils/validation";
import { getRequestLogger } from "@/utils/requestLogger";
import { handleControllerError } from "@/utils/controllerError";

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getManagedProductsRoute(req: Request): string {
  return req.path.endsWith("/mine")
    ? "GET /api/admin/products/mine"
    : "GET /api/admin/products";
}

export async function listManagedProducts(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  const route = getManagedProductsRoute(req);

  if (!req.user) {
    adminControllerLogger.warn({ route }, "Unauthorized admin request");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    { route, userId: req.user.id },
    "List managed products request received"
  );

  try {
    const result = await listManagedProductsService(
      req.user.id,
      requestLogger.child({ module: "admin-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: adminControllerLogger,
      route,
      failureMessage: "List managed products request failed",
      unexpectedMessage: "Unexpected error while handling list managed products request",
      context: { userId: req.user.id },
    });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });

  if (!req.user) {
    adminControllerLogger.warn(
      { route: "POST /api/admin/products" },
      "Unauthorized admin request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    { route: "POST /api/admin/products", userId: req.user.id },
    "Create product request received"
  );

  const input = validateOrRespond(
    adminCreateProductSchema,
    req.body,
    res,
    "POST /api/admin/products"
  );
  if (input === null) {
    adminControllerLogger.debug(
      { route: "POST /api/admin/products", userId: req.user.id },
      "Create product request rejected due to invalid input"
    );
    return;
  }

  try {
    const result = await createProductService(
      req.user.id,
      input,
      requestLogger.child({ module: "admin-service" })
    );
    res.status(201).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: adminControllerLogger,
      route: "POST /api/admin/products",
      failureMessage: "Create product request failed",
      unexpectedMessage: "Unexpected error while handling create product request",
      context: { userId: req.user.id },
    });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  const productId = getSingleParam(req.params.id);

  if (!req.user) {
    adminControllerLogger.warn(
      { route: "PATCH /api/admin/products/:id" },
      "Unauthorized admin request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    {
      route: "PATCH /api/admin/products/:id",
      userId: req.user.id,
      productId,
    },
    "Update product request received"
  );
  if (!productId) {
    adminControllerLogger.warn(
      { route: "PATCH /api/admin/products/:id", userId: req.user.id },
      "Update product request failed because product id was missing"
    );
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  const input = validateOrRespond(
    adminUpdateProductSchema,
    req.body,
    res,
    "PATCH /api/admin/products/:id"
  );
  if (input === null) {
    adminControllerLogger.debug(
      {
        route: "PATCH /api/admin/products/:id",
        userId: req.user.id,
        productId,
      },
      "Update product request rejected due to invalid input"
    );
    return;
  }

  try {
    const result = await updateProductService(
      req.user.id,
      productId,
      input,
      requestLogger.child({ module: "admin-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: adminControllerLogger,
      route: "PATCH /api/admin/products/:id",
      failureMessage: "Update product request failed",
      unexpectedMessage: "Unexpected error while handling update product request",
      context: { userId: req.user.id, productId },
    });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  const productId = getSingleParam(req.params.id);

  if (!req.user) {
    adminControllerLogger.warn(
      { route: "DELETE /api/admin/products/:id" },
      "Unauthorized admin request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    {
      route: "DELETE /api/admin/products/:id",
      userId: req.user.id,
      productId,
    },
    "Delete product request received"
  );
  if (!productId) {
    adminControllerLogger.warn(
      { route: "DELETE /api/admin/products/:id", userId: req.user.id },
      "Delete product request failed because product id was missing"
    );
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  try {
    const result = await deleteProductService(
      req.user.id,
      productId,
      requestLogger.child({ module: "admin-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: adminControllerLogger,
      route: "DELETE /api/admin/products/:id",
      failureMessage: "Delete product request failed",
      unexpectedMessage: "Unexpected error while handling delete product request",
      context: { userId: req.user.id, productId },
    });
  }
}

export async function updateFlashSale(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  const productId = getSingleParam(req.params.id);

  if (!req.user) {
    adminControllerLogger.warn(
      { route: "PATCH /api/admin/products/:id/flash-sale" },
      "Unauthorized admin request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    {
      route: "PATCH /api/admin/products/:id/flash-sale",
      userId: req.user.id,
      productId,
    },
    "Update flash sale request received"
  );
  if (!productId) {
    adminControllerLogger.warn(
      {
        route: "PATCH /api/admin/products/:id/flash-sale",
        userId: req.user.id,
      },
      "Update flash sale request failed because product id was missing"
    );
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  const input = validateOrRespond(
    adminUpdateFlashSaleSchema,
    req.body,
    res,
    "PATCH /api/admin/products/:id/flash-sale"
  );
  if (input === null) {
    adminControllerLogger.debug(
      {
        route: "PATCH /api/admin/products/:id/flash-sale",
        userId: req.user.id,
        productId,
      },
      "Update flash sale request rejected due to invalid input"
    );
    return;
  }

  try {
    const result = await updateFlashSaleService(
      req.user.id,
      productId,
      input,
      requestLogger.child({ module: "admin-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: adminControllerLogger,
      route: "PATCH /api/admin/products/:id/flash-sale",
      failureMessage: "Update flash sale request failed",
      unexpectedMessage: "Unexpected error while handling update flash sale request",
      context: { userId: req.user.id, productId },
    });
  }
}

export async function createManager(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });

  if (!req.user) {
    adminControllerLogger.warn(
      { route: "POST /api/admin/managers" },
      "Unauthorized admin request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    { route: "POST /api/admin/managers", userId: req.user.id },
    "Create manager request received"
  );

  const input = validateOrRespond(
    adminCreateManagerSchema,
    req.body,
    res,
    "POST /api/admin/managers"
  );
  if (input === null) {
    adminControllerLogger.debug(
      { route: "POST /api/admin/managers", userId: req.user.id },
      "Create manager request rejected due to invalid input"
    );
    return;
  }

  try {
    const result = await createManagerService(
      input,
      requestLogger.child({ module: "admin-service" })
    );
    res.status(201).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: adminControllerLogger,
      route: "POST /api/admin/managers",
      failureMessage: "Create manager request failed",
      unexpectedMessage: "Unexpected error while handling create manager request",
      context: { userId: req.user.id },
    });
  }
}

export async function deleteManager(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  const managerId = getSingleParam(req.params.id);

  if (!req.user) {
    adminControllerLogger.warn(
      { route: "DELETE /api/admin/managers/:id" },
      "Unauthorized admin request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    {
      route: "DELETE /api/admin/managers/:id",
      userId: req.user.id,
      managerId,
    },
    "Delete manager request received"
  );
  if (!managerId) {
    adminControllerLogger.warn(
      { route: "DELETE /api/admin/managers/:id", userId: req.user.id },
      "Delete manager request failed because manager id was missing"
    );
    res.status(400).json({ message: "Manager id is required" });
    return;
  }

  try {
    const result = await deleteManagerService(
      managerId,
      requestLogger.child({ module: "admin-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: adminControllerLogger,
      route: "DELETE /api/admin/managers/:id",
      failureMessage: "Delete manager request failed",
      unexpectedMessage: "Unexpected error while handling delete manager request",
      context: { userId: req.user.id, managerId },
    });
  }
}

export async function listManagers(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });

  if (!req.user) {
    adminControllerLogger.warn(
      { route: "GET /api/admin/managers" },
      "Unauthorized admin request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    { route: "GET /api/admin/managers", userId: req.user.id },
    "List managers request received"
  );

  try {
    const result = await listManagersService(
      requestLogger.child({ module: "admin-service" })
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: adminControllerLogger,
      route: "GET /api/admin/managers",
      failureMessage: "List managers request failed",
      unexpectedMessage: "Unexpected error while handling list managers request",
      context: { userId: req.user.id },
    });
  }
}
