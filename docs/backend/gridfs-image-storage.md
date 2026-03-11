# GridFS Image Storage Decision

## Summary

This project will store uploaded product images in MongoDB GridFS instead of a filesystem volume or S3-compatible object storage.

The decision is pragmatic for the current scope:
- Kubernetes-friendly without depending on node-local disk or EBS attachment behavior
- Simpler operational model than introducing S3 bucket configuration for this assignment
- Easier to keep authorization and file access behind the existing backend API

This is a project-scope decision, not a claim that GridFS is the best long-term production choice for public image delivery at scale.

## Scope and Constraints

GridFS will be used only for uploaded product images.

To keep database growth and response size under control, uploads should be constrained:
- Resize images before storage
- Target maximum display size: `640px` on the longest edge
- Enforce an upload size limit after processing
- Limit accepted formats to common web image types such as `image/jpeg`, `image/png`, and optionally `image/webp`

This design is intended for small product images, not large media files or general-purpose file hosting.

## Why GridFS Fits This Project

### 1. Better fit for Kubernetes than local file storage

If uploaded files are stored on backend-local disk or EBS-backed volumes, Kubernetes deployment becomes more complex:
- pods may move between nodes
- persistent volume attachment introduces scheduling constraints
- multi-replica API deployments complicate shared file access

GridFS avoids those issues because image persistence stays inside MongoDB, which is already part of the application architecture.

### 2. Lower implementation overhead than S3 for this assignment

S3-compatible storage is a better production pattern for large-scale media delivery, but it introduces extra setup:
- bucket provisioning
- credentials and secret management
- CORS configuration
- public vs private object policy decisions
- signed URL flow if files are not public

For a course project with constrained time, GridFS keeps the system simpler and more self-contained.

### 3. Cleaner backend-controlled access path

With GridFS, the backend can expose images through an API such as `GET /api/images/:id` and keep these concerns in one place:
- content type handling
- authorization if needed later
- validation of file ownership or product linkage
- consistent error handling

## Proposed Backend Shape

### Product model impact

The current product schema uses string paths such as `imageUrl` and `descriptionImages` for frontend static assets.

For uploaded images, the backend should move toward storing file identifiers instead of only static URLs. A practical transition path is:
- keep `imageUrl` for existing seed/static assets
- add GridFS-backed identifiers for uploaded assets

Example future fields:
- `imageFileId: ObjectId | null`
- `descriptionImageFileIds: ObjectId[]`

This allows the current seeded catalog to continue working while new uploads use GridFS.

### API impact

Expected API additions or adjustments:
- `POST /api/uploads/images`
  - accepts one image file
  - validates type and size
  - resizes to the project limit before saving
  - returns file metadata and an image access URL
- `GET /api/images/:id`
  - streams the stored image from GridFS
  - returns the correct `Content-Type`
- product create/update APIs
  - may accept uploaded file references instead of raw URL strings for new images

Suggested response shape from upload:

```json
{
  "fileId": "65f0c7d1d0c9b7f0f2c1a123",
  "url": "/api/images/65f0c7d1d0c9b7f0f2c1a123",
  "contentType": "image/jpeg",
  "width": 640,
  "height": 480
}
```

## Operational Notes

- Do not embed large Base64 strings inside normal product documents.
- Keep image retrieval separate from product list/detail responses.
- Product APIs should return image references, while image bytes should be streamed from a dedicated endpoint.
- If image traffic grows significantly later, the storage layer can be migrated behind the same API contract.

## Rejected Alternative: S3-Compatible Object Storage

S3 remains the better long-term option for scalable media delivery, but it is rejected for the current project phase for these reasons:
- higher setup and integration cost than the assignment needs
- more moving parts in Kubernetes deployment and environment configuration
- additional policy design for public URLs vs signed URLs
- more failure modes to test and debug during a time-constrained implementation
- limited benefit for this project because uploaded images are intentionally small and constrained
