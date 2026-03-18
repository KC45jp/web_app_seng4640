import { randomUUID } from "node:crypto";

import { GridFSBucket, ObjectId } from "mongodb";
import mongoose from "mongoose";
import type { Logger } from "pino";
import sharp from "sharp";
import type { UploadImageResult } from "@seng4640/shared";

import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from "@/utils/errors";

const GRIDFS_BUCKET_NAME = "product-images";
const MAX_IMAGE_DIMENSION_PX = 640;
const MAX_PROCESSED_IMAGE_BYTES = 512 * 1024;
const SUPPORTED_CONTENT_TYPE = "image/jpeg";

type UploadImageInput = {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  uploaderId: string;
};

export type GetImageByIdResult = {
  contentType: string;
  contentLength?: number;
  stream: ReturnType<GridFSBucket["openDownloadStream"]>;
};

function getImagesBucket(): GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) {
    throw new ServiceUnavailableError("MongoDB connection is not ready");
  }

  return new GridFSBucket(db, { bucketName: GRIDFS_BUCKET_NAME });
}

function buildUploadFilename(originalName: string): string {
  const normalizedName = originalName.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  const safeName = normalizedName.length > 0 ? normalizedName : "image.jpg";
  return `${randomUUID()}-${safeName.replace(/\.[^.]+$/, "")}.jpg`;
}

function readStoredContentType(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const contentType = (metadata as { contentType?: unknown }).contentType;
  return typeof contentType === "string" ? contentType : undefined;
}

async function processImageBuffer(
  buffer: Buffer,
  requestLogger: Logger
): Promise<{ buffer: Buffer; width: number; height: number }> {
  try {
    const { data, info } = await sharp(buffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION_PX,
        height: MAX_IMAGE_DIMENSION_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        mozjpeg: true,
      })
      .toBuffer({ resolveWithObject: true });

    if (data.length > MAX_PROCESSED_IMAGE_BYTES) {
      requestLogger.warn(
        {
          processedBytes: data.length,
          maxBytes: MAX_PROCESSED_IMAGE_BYTES,
        },
        "Processed image exceeded allowed size"
      );
      throw new BadRequestError("Processed image is too large");
    }

    return {
      buffer: data,
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    requestLogger.warn({ err: error }, "Image processing failed");
    throw new BadRequestError("Invalid image file");
  }
}

export async function uploadImage(
  input: UploadImageInput,
  requestLogger: Logger
): Promise<UploadImageResult> {
  requestLogger.debug(
    {
      uploaderId: input.uploaderId,
      originalName: input.originalName,
      contentType: input.contentType,
      bytes: input.buffer.length,
    },
    "Upload image service started"
  );

  if (input.contentType !== SUPPORTED_CONTENT_TYPE) {
    requestLogger.warn(
      { contentType: input.contentType },
      "Upload image failed because content type was unsupported"
    );
    throw new BadRequestError("Only JPEG images are supported");
  }

  if (input.buffer.length === 0) {
    requestLogger.warn({ uploaderId: input.uploaderId }, "Upload image failed because file was empty");
    throw new BadRequestError("Image file is empty");
  }

  const processedImage = await processImageBuffer(input.buffer, requestLogger);
  const bucket = getImagesBucket();
  const uploadStream = bucket.openUploadStream(buildUploadFilename(input.originalName), {
    metadata: {
      contentType: SUPPORTED_CONTENT_TYPE,
      uploaderId: input.uploaderId,
      width: processedImage.width,
      height: processedImage.height,
      originalName: input.originalName,
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", () => {
      resolve();
    });
    uploadStream.on("error", (error: Error) => {
      reject(error);
    });
    uploadStream.end(processedImage.buffer);
  });

  const fileId =
    uploadStream.id instanceof ObjectId
      ? uploadStream.id.toHexString()
      : String(uploadStream.id);

  requestLogger.debug(
    { uploaderId: input.uploaderId, fileId },
    "Upload image service completed"
  );

  return {
    fileId,
    imageId: fileId,
    url: `/api/images/${fileId}`,
    contentType: SUPPORTED_CONTENT_TYPE,
    width: processedImage.width,
    height: processedImage.height,
  };
}

export async function getImageById(
  _imageId: string,
  requestLogger: Logger
): Promise<GetImageByIdResult> {
  requestLogger.debug({ imageId: _imageId }, "Get image by id service started");
  if (!ObjectId.isValid(_imageId)) {
    requestLogger.warn({ imageId: _imageId }, "Invalid image id");
    throw new BadRequestError("Invalid image id");
  }

  const bucket = getImagesBucket();
  const imageObjectId = new ObjectId(_imageId);
  const [file] = await bucket.find({ _id: imageObjectId }).limit(1).toArray();

  if (!file) {
    requestLogger.info({ imageId: _imageId }, "Image not found");
    throw new NotFoundError("Image not found");
  }

  requestLogger.debug({ imageId: _imageId }, "Get image by id service completed");
  return {
    contentType: readStoredContentType(file.metadata) ?? "application/octet-stream",
    contentLength: typeof file.length === "number" ? file.length : undefined,
    stream: bucket.openDownloadStream(imageObjectId),
  };
}
