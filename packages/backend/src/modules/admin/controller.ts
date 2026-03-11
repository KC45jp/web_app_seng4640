import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import {
  adminCreateManagerSchema,
  adminCreateProductSchema,
  adminUpdateFlashSaleSchema,
  adminUpdateProductSchema,
} from "./schema";
import { validateOrRespond } from "../../utils/validation";
import { getRequestLogger } from "@/utils/requestLogger";

export async function listManagedProducts(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  if (!req.user) {
    adminControllerLogger.warn(
      { route: "GET /api/admin/products" },
      "Unauthorized admin request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  adminControllerLogger.debug(
    { route: "GET /api/admin/products", userId: req.user.id },
    "List managed products request received"
  );
  notImplemented(res, "GET /api/admin/products");
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  adminControllerLogger.debug(
    { route: "POST /api/admin/products", userId: req.user?.id },
    "Create product request received"
  );
  if (
    validateOrRespond(
      adminCreateProductSchema,
      req.body,
      res,
      "POST /api/admin/products"
    ) === null
  ) {
    adminControllerLogger.debug(
      { route: "POST /api/admin/products", userId: req.user?.id },
      "Create product request rejected due to invalid input"
    );
    return;
  }

  notImplemented(res, "POST /api/admin/products");
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  adminControllerLogger.debug(
    {
      route: "PATCH /api/admin/products/:id",
      userId: req.user?.id,
      productId: req.params.id,
    },
    "Update product request received"
  );
  if (!req.params.id) {
    adminControllerLogger.warn(
      { route: "PATCH /api/admin/products/:id", userId: req.user?.id },
      "Update product request failed because product id was missing"
    );
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  if (
    validateOrRespond(
      adminUpdateProductSchema,
      req.body,
      res,
      "PATCH /api/admin/products/:id"
    ) === null
  ) {
    adminControllerLogger.debug(
      {
        route: "PATCH /api/admin/products/:id",
        userId: req.user?.id,
        productId: req.params.id,
      },
      "Update product request rejected due to invalid input"
    );
    return;
  }

  notImplemented(res, "PATCH /api/admin/products/:id");
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  adminControllerLogger.debug(
    {
      route: "DELETE /api/admin/products/:id",
      userId: req.user?.id,
      productId: req.params.id,
    },
    "Delete product request received"
  );
  if (!req.params.id) {
    adminControllerLogger.warn(
      { route: "DELETE /api/admin/products/:id", userId: req.user?.id },
      "Delete product request failed because product id was missing"
    );
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  notImplemented(res, "DELETE /api/admin/products/:id");
}

export async function updateFlashSale(
  req: Request,
  res: Response
): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  adminControllerLogger.debug(
    {
      route: "PATCH /api/admin/products/:id/flash-sale",
      userId: req.user?.id,
      productId: req.params.id,
    },
    "Update flash sale request received"
  );
  if (!req.params.id) {
    adminControllerLogger.warn(
      { route: "PATCH /api/admin/products/:id/flash-sale", userId: req.user?.id },
      "Update flash sale request failed because product id was missing"
    );
    res.status(400).json({ message: "Product id is required" });
    return;
  }

  if (
    validateOrRespond(
      adminUpdateFlashSaleSchema,
      req.body,
      res,
      "PATCH /api/admin/products/:id/flash-sale"
    ) === null
  ) {
    adminControllerLogger.debug(
      {
        route: "PATCH /api/admin/products/:id/flash-sale",
        userId: req.user?.id,
        productId: req.params.id,
      },
      "Update flash sale request rejected due to invalid input"
    );
    return;
  }

  notImplemented(res, "PATCH /api/admin/products/:id/flash-sale");
}

export async function createManager(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  adminControllerLogger.debug(
    { route: "POST /api/admin/managers", userId: req.user?.id },
    "Create manager request received"
  );
  if (
    validateOrRespond(
      adminCreateManagerSchema,
      req.body,
      res,
      "POST /api/admin/managers"
    ) === null
  ) {
    adminControllerLogger.debug(
      { route: "POST /api/admin/managers", userId: req.user?.id },
      "Create manager request rejected due to invalid input"
    );
    return;
  }

  notImplemented(res, "POST /api/admin/managers");
}

export async function deleteManager(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  adminControllerLogger.debug(
    {
      route: "DELETE /api/admin/managers/:id",
      userId: req.user?.id,
      managerId: req.params.id,
    },
    "Delete manager request received"
  );
  if (!req.params.id) {
    adminControllerLogger.warn(
      { route: "DELETE /api/admin/managers/:id", userId: req.user?.id },
      "Delete manager request failed because manager id was missing"
    );
    res.status(400).json({ message: "Manager id is required" });
    return;
  }

  notImplemented(res, "DELETE /api/admin/managers/:id");
}

export async function listManagers(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const adminControllerLogger = requestLogger.child({ module: "admin-controller" });
  adminControllerLogger.debug(
    { route: "GET /api/admin/managers", userId: req.user?.id },
    "List managers request received"
  );
  notImplemented(res, "GET /api/admin/managers");
}
