import bcrypt from "bcryptjs";
import { UserRole, type AdminCreateManagerInput, type AdminCreateManagerResult, type AdminCreateProductInput, type AdminDeleteManagerResult, type AdminListManagedProductsResult, type AdminListManagersResult, type AdminManagerSummary, type AdminProductResult, type AdminUpdateFlashSaleInput, type AdminUpdateProductInput, type Product, type ProductDetail } from "@seng4640/shared";
import { MongoServerError } from "mongodb";
import { Types, isValidObjectId, type InferSchemaType, type Require_id } from "mongoose";
import type { Logger } from "pino";

import { productModel, productSchema } from "@/db/models/product.models";
import { userModel, userSchema } from "@/db/models/user.models";
import { BadRequestError, ConflictError, NotFoundError } from "@/utils/errors";

type ProductDoc = Require_id<InferSchemaType<typeof productSchema>>;
type UserDoc = Require_id<InferSchemaType<typeof userSchema>>;

type CreateProductRecordOptions = {
  productOwnerId: Types.ObjectId | null;
};

function serializeManagedProduct(doc: ProductDoc): Product {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    flashSalePrice: doc.flashSalePrice ?? null,
    category: doc.category,
    imageUrl: doc.imageUrl,
    isFlashSale: doc.isFlashSale,
    isActive: doc.isActive,
    createdAt: doc.createdAt?.toISOString(),
  };
}

function serializeManagedProductDetail(doc: ProductDoc): ProductDetail {
  return {
    ...serializeManagedProduct(doc),
    detailedDescription: doc.detailedDescription ?? null,
    stock: doc.stock,
    descriptionImages: doc.descriptionImages ?? [],
    flashSaleStartAt: doc.flashSaleStartAt?.toISOString() ?? null,
    flashSaleEndAt: doc.flashSaleEndAt?.toISOString() ?? null,
    productOwnerId: doc.productOwnerId?.toString() ?? null,
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

function serializeManagerSummary(doc: UserDoc): AdminManagerSummary {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: UserRole.MANAGER,
  };
}

function assertValidObjectId(value: string, label: string, requestLogger: Logger): void {
  if (!isValidObjectId(value)) {
    requestLogger.warn({ [label]: value }, `Invalid ${label}`);
    throw new BadRequestError(`Invalid ${label}`);
  }
}

async function findManagedProduct(
  managerId: string,
  productId: string
): Promise<ProductDoc | null> {
  return productModel
    .findOne({ _id: productId, productOwnerId: managerId })
    .lean<ProductDoc | null>();
}

function buildCreateProductPayload(
  input: AdminCreateProductInput,
  options: CreateProductRecordOptions
) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    stock: input.stock,
    imageUrl: input.imageUrl.trim(),
    category: input.category.trim(),
    productOwnerId: options.productOwnerId,
    isFlashSale: input.isFlashSale ?? false,
    flashSalePrice: null,
    flashSaleStartAt: null,
    flashSaleEndAt: null,
    isActive: true,
  };
}

async function createProductRecord(
  input: AdminCreateProductInput,
  options: CreateProductRecordOptions
): Promise<ProductDoc> {
  return (
    await productModel.create(buildCreateProductPayload(input, options))
  ).toObject() as ProductDoc;
}

export async function createSeedProduct(
  input: AdminCreateProductInput,
  requestLogger: Logger
): Promise<void> {
  requestLogger.debug({ productName: input.name }, "Seed product create started");

  const product = await createProductRecord(input, {
    productOwnerId: null,
  });

  requestLogger.debug(
    { productName: product.name, productId: product._id.toString() },
    "Seed product create completed"
  );
}

export async function listManagedProducts(
  managerId: string,
  requestLogger: Logger
): Promise<AdminListManagedProductsResult> {
  requestLogger.debug({ managerId }, "List managed products service started");
  assertValidObjectId(managerId, "managerId", requestLogger);

  const products = await productModel
    .find({ productOwnerId: managerId })
    .sort({ createdAt: -1 })
    .lean<ProductDoc[]>();

  requestLogger.debug(
    { managerId, productCount: products.length },
    "List managed products service completed"
  );

  return {
    items: products.map(serializeManagedProduct),
  };
}

export async function createProduct(
  managerId: string,
  input: AdminCreateProductInput,
  requestLogger: Logger
): Promise<AdminProductResult> {
  requestLogger.debug({ managerId, input }, "Create product service started");
  assertValidObjectId(managerId, "managerId", requestLogger);

  const product = await createProductRecord(input, {
    productOwnerId: new Types.ObjectId(managerId),
  });

  requestLogger.debug(
    { managerId, productId: product._id.toString() },
    "Create product service completed"
  );

  return {
    product: serializeManagedProductDetail(product),
  };
}

export async function updateProduct(
  managerId: string,
  productId: string,
  input: AdminUpdateProductInput,
  requestLogger: Logger
): Promise<AdminProductResult> {
  requestLogger.debug(
    { managerId, productId, input },
    "Update product service started"
  );
  assertValidObjectId(managerId, "managerId", requestLogger);
  assertValidObjectId(productId, "productId", requestLogger);

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name.trim();
  if (input.description !== undefined) update.description = input.description.trim();
  if (input.price !== undefined) update.price = input.price;
  if (input.stock !== undefined) update.stock = input.stock;
  if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl.trim();
  if (input.category !== undefined) update.category = input.category.trim();
  if (input.isFlashSale !== undefined) update.isFlashSale = input.isFlashSale;

  const product =
    Object.keys(update).length === 0
      ? await findManagedProduct(managerId, productId)
      : await productModel
          .findOneAndUpdate(
            {
              _id: productId,
              productOwnerId: managerId,
            },
            {
              $set: update,
            },
            {
              new: true,
              runValidators: true,
            }
          )
          .lean<ProductDoc | null>();

  if (!product) {
    requestLogger.info(
      { managerId, productId },
      "Update product failed because managed product was not found"
    );
    throw new NotFoundError("Product not found");
  }

  requestLogger.debug(
    { managerId, productId },
    "Update product service completed"
  );

  return {
    product: serializeManagedProductDetail(product),
  };
}

export async function deleteProduct(
  managerId: string,
  productId: string,
  requestLogger: Logger
): Promise<AdminProductResult> {
  requestLogger.debug(
    { managerId, productId },
    "Delete product service started"
  );
  assertValidObjectId(managerId, "managerId", requestLogger);
  assertValidObjectId(productId, "productId", requestLogger);

  const product = await productModel
    .findOneAndUpdate(
      {
        _id: productId,
        productOwnerId: managerId,
      },
      {
        $set: {
          isActive: false,
        },
      },
      {
        new: true,
      }
    )
    .lean<ProductDoc | null>();

  if (!product) {
    requestLogger.info(
      { managerId, productId },
      "Delete product failed because managed product was not found"
    );
    throw new NotFoundError("Product not found");
  }

  requestLogger.debug(
    { managerId, productId },
    "Delete product service completed"
  );

  return {
    product: serializeManagedProductDetail(product),
  };
}

export async function updateFlashSale(
  managerId: string,
  productId: string,
  input: AdminUpdateFlashSaleInput,
  requestLogger: Logger
): Promise<AdminProductResult> {
  requestLogger.debug(
    { managerId, productId, input },
    "Update flash sale service started"
  );
  assertValidObjectId(managerId, "managerId", requestLogger);
  assertValidObjectId(productId, "productId", requestLogger);

  if (
    input.isFlashSale &&
    (input.flashSalePrice === null || input.flashSalePrice === undefined)
  ) {
    requestLogger.warn(
      { managerId, productId },
      "Update flash sale failed because flash sale price was missing"
    );
    throw new BadRequestError("flashSalePrice is required when enabling flash sale");
  }

  if (
    input.flashSaleStartAt &&
    input.flashSaleEndAt &&
    input.flashSaleEndAt < input.flashSaleStartAt
  ) {
    requestLogger.warn(
      { managerId, productId },
      "Update flash sale failed because end time was before start time"
    );
    throw new BadRequestError("flashSaleEndAt must be later than flashSaleStartAt");
  }

  const product = await productModel
    .findOneAndUpdate(
      {
        _id: productId,
        productOwnerId: managerId,
      },
      {
        $set: input.isFlashSale
          ? {
              isFlashSale: true,
              flashSaleStartAt: input.flashSaleStartAt ?? null,
              flashSaleEndAt: input.flashSaleEndAt ?? null,
              flashSalePrice: input.flashSalePrice ?? null,
            }
          : {
              isFlashSale: false,
              flashSaleStartAt: null,
              flashSaleEndAt: null,
              flashSalePrice: null,
            },
      },
      {
        new: true,
        runValidators: true,
      }
    )
    .lean<ProductDoc | null>();

  if (!product) {
    requestLogger.info(
      { managerId, productId },
      "Update flash sale failed because managed product was not found"
    );
    throw new NotFoundError("Product not found");
  }

  requestLogger.debug(
    { managerId, productId },
    "Update flash sale service completed"
  );

  return {
    product: serializeManagedProductDetail(product),
  };
}

export async function createManager(
  input: AdminCreateManagerInput,
  requestLogger: Logger
): Promise<AdminCreateManagerResult> {
  requestLogger.debug({ email: input.email, name: input.name }, "Create manager service started");

  try {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const manager = (
      await userModel.create({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash,
        role: UserRole.MANAGER,
      })
    ).toObject() as UserDoc;

    requestLogger.debug(
      { managerId: manager._id.toString(), email: manager.email },
      "Create manager service completed"
    );

    return {
      manager: serializeManagerSummary(manager),
    };
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      requestLogger.warn(
        { email: input.email.trim().toLowerCase() },
        "Create manager failed because email already exists"
      );
      throw new ConflictError("Email already exists");
    }

    throw error;
  }
}

export async function deleteManager(
  managerId: string,
  requestLogger: Logger
): Promise<AdminDeleteManagerResult> {
  requestLogger.debug({ managerId }, "Delete manager service started");
  assertValidObjectId(managerId, "managerId", requestLogger);

  const manager = await userModel
    .findOne({ _id: managerId, role: UserRole.MANAGER })
    .lean<UserDoc | null>();

  if (!manager) {
    requestLogger.info({ managerId }, "Delete manager failed because manager was not found");
    throw new NotFoundError("Manager not found");
  }

  await productModel.updateMany(
    { productOwnerId: manager._id },
    {
      $set: {
        isActive: false,
      },
    }
  );

  await userModel.deleteOne({ _id: manager._id });

  requestLogger.debug({ managerId }, "Delete manager service completed");
  return {
    managerId,
  };
}

export async function listManagers(
  requestLogger: Logger
): Promise<AdminListManagersResult> {
  requestLogger.debug("List managers service started");

  const managers = await userModel
    .find({ role: UserRole.MANAGER })
    .sort({ createdAt: -1 })
    .select("_id name email role")
    .lean<UserDoc[]>();

  requestLogger.debug({ managerCount: managers.length }, "List managers service completed");

  return {
    items: managers.map(serializeManagerSummary),
  };
}
