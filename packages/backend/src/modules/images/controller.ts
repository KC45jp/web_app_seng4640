import type { Request, Response } from "express";
import { notImplemented } from "../../utils/notImplemented";
import { getRequestLogger } from "@/utils/requestLogger";

export async function uploadImage(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const imagesControllerLogger = requestLogger.child({ module: "images-controller" });
  if (!req.user) {
    imagesControllerLogger.warn(
      { route: "POST /api/images" },
      "Unauthorized upload request"
    );
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  imagesControllerLogger.debug(
    { route: "POST /api/images", userId: req.user.id },
    "Upload image request received"
  );
  notImplemented(res, "POST /api/images");
}

export async function getImageById(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const imagesControllerLogger = requestLogger.child({ module: "images-controller" });

  imagesControllerLogger.debug(
    { route: "GET /api/images/:id", imageId: req.params.id },
    "Get image by id request received"
  );
  if (!req.params.id) {
    imagesControllerLogger.warn(
      { route: "GET /api/images/:id" },
      "Get image by id request failed because image id was missing"
    );
    res.status(400).json({ message: "Image id is required" });
    return;
  }

  notImplemented(res, "GET /api/images/:id");
}
