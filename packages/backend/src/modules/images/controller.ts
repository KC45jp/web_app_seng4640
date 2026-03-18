import multer, { MulterError } from "multer";
import type { Request, Response } from "express";

import { getRequestLogger } from "@/utils/requestLogger";
import { handleControllerError } from "@/utils/controllerError";
import {
  getImageById as getImageByIdService,
  uploadImage as uploadImageService,
} from "./service";

const MAX_INPUT_IMAGE_BYTES = 5 * 1024 * 1024;

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_INPUT_IMAGE_BYTES,
    files: 1,
  },
}).single("image");

function runUploadMiddleware(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const imagesControllerLogger = requestLogger.child({ module: "images-controller" });
  const imagesServiceLogger = requestLogger.child({ module: "images-service" });

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

  try {
    await runUploadMiddleware(req, res);
  } catch (error) {
    if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
      imagesControllerLogger.warn(
        { route: "POST /api/images", userId: req.user.id, maxBytes: MAX_INPUT_IMAGE_BYTES },
        "Upload image request rejected because file was too large"
      );
      res.status(400).json({ message: "Image file is too large" });
      return;
    }

    handleControllerError({
      error,
      res,
      logger: imagesControllerLogger,
      route: "POST /api/images",
      failureMessage: "Upload image request failed",
      unexpectedMessage: "Unexpected error while handling upload image request",
      context: { userId: req.user.id },
    });
    return;
  }

  if (!req.file) {
    imagesControllerLogger.warn(
      { route: "POST /api/images", userId: req.user.id },
      "Upload image request failed because file was missing"
    );
    res.status(400).json({ message: "Image file is required" });
    return;
  }

  try {
    const result = await uploadImageService(
      {
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
        uploaderId: req.user.id,
      },
      imagesServiceLogger
    );
    res.status(201).json(result);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: imagesControllerLogger,
      route: "POST /api/images",
      failureMessage: "Upload image request failed",
      unexpectedMessage: "Unexpected error while handling upload image request",
      context: { userId: req.user.id, fileName: req.file.originalname },
    });
  }
}

export async function getImageById(req: Request, res: Response): Promise<void> {
  const requestLogger = getRequestLogger(req);
  const imagesControllerLogger = requestLogger.child({ module: "images-controller" });
  const imagesServiceLogger = requestLogger.child({ module: "images-service" });
  const imageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  imagesControllerLogger.debug(
    { route: "GET /api/images/:id", imageId },
    "Get image by id request received"
  );
  if (!imageId) {
    imagesControllerLogger.warn(
      { route: "GET /api/images/:id" },
      "Get image by id request failed because image id was missing"
    );
    res.status(400).json({ message: "Image id is required" });
    return;
  }

  try {
    const result = await getImageByIdService(imageId, imagesServiceLogger);

    res.setHeader("Content-Type", result.contentType);
    if (result.contentLength !== undefined) {
      res.setHeader("Content-Length", String(result.contentLength));
    }
    res.setHeader("Cache-Control", "public, max-age=86400");

    result.stream.on("error", (error) => {
      imagesControllerLogger.error(
        { err: error, route: "GET /api/images/:id", imageId },
        "Image stream failed"
      );

      if (!res.headersSent) {
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      res.destroy(error instanceof Error ? error : undefined);
    });

    result.stream.pipe(res);
  } catch (error) {
    handleControllerError({
      error,
      res,
      logger: imagesControllerLogger,
      route: "GET /api/images/:id",
      failureMessage: "Get image by id request failed",
      unexpectedMessage: "Unexpected error while handling get image by id request",
      context: { imageId },
    });
  }
}
