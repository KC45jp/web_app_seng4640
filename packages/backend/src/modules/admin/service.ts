import type { Logger } from "pino";

export async function createProduct(requestLogger: Logger): Promise<void> {
  requestLogger.debug("Create product service started");
  // TODO: implement admin product create.
}

export async function updateProduct(requestLogger: Logger): Promise<void> {
  requestLogger.debug("Update product service started");
  // TODO: implement admin product update.
}

export async function deleteProduct(requestLogger: Logger): Promise<void> {
  requestLogger.debug("Delete product service started");
  // TODO: implement admin product delete.
}

export async function updateFlashSale(requestLogger: Logger): Promise<void> {
  requestLogger.debug("Update flash sale service started");
  // TODO: implement admin flash sale update.
}

export async function createManager(requestLogger: Logger): Promise<void> {
  requestLogger.debug("Create manager service started");
  // TODO: implement super-admin manager create.
}

export async function deleteManager(requestLogger: Logger): Promise<void> {
  requestLogger.debug("Delete manager service started");
  // TODO: implement super-admin manager delete.
}

export async function listManagers(requestLogger: Logger): Promise<void> {
  requestLogger.debug("List managers service started");
  // TODO: implement super-admin manager list.
}
