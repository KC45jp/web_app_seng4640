import type { Logger } from "pino";

export async function uploadImage(requestLogger: Logger): Promise<void> {
  requestLogger.debug("Upload image service started");
  // TODO: validate file type and size, resize to 640px, save to GridFS, return UploadImageResult.
}

export async function getImageById(_imageId: string, requestLogger: Logger): Promise<void> {
  requestLogger.debug({ imageId: _imageId }, "Get image by id service started");
  // TODO: stream image from GridFS with correct Content-Type.
}
