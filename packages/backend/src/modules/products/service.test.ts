import type { Logger } from "pino";

import { productModel } from "@/db/models/product.models";

import { listProducts } from "./service";

jest.mock("@/db/models/product.models", () => ({
  productModel: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
  productSchema: {},
}));

type QueryChain = {
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  collation: jest.Mock;
  lean: jest.Mock;
};

const testLogger = {
  debug: jest.fn(),
} as unknown as Logger;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("products service", () => {
  it("applies natural collation for name sort", async () => {
    const findMock = productModel.find as unknown as jest.Mock;
    const countDocumentsMock = productModel.countDocuments as unknown as jest.Mock;
    const queryChain = buildQueryChain([]);

    findMock.mockReturnValue(queryChain);
    countDocumentsMock.mockResolvedValue(0);

    await listProducts({ sortBy: "name", sortOrder: "asc" }, testLogger);

    expect(findMock).toHaveBeenCalledWith({ isActive: true });
    expect(queryChain.sort).toHaveBeenCalledWith({ name: 1 });
    expect(queryChain.collation).toHaveBeenCalledWith({
      locale: "en",
      numericOrdering: true,
      strength: 2,
    });
  });

  it("does not apply name collation for non-name sorts", async () => {
    const findMock = productModel.find as unknown as jest.Mock;
    const countDocumentsMock = productModel.countDocuments as unknown as jest.Mock;
    const queryChain = buildQueryChain([]);

    findMock.mockReturnValue(queryChain);
    countDocumentsMock.mockResolvedValue(0);

    await listProducts({ sortBy: "price", sortOrder: "desc" }, testLogger);

    expect(queryChain.sort).toHaveBeenCalledWith({ price: -1 });
    expect(queryChain.collation).not.toHaveBeenCalled();
  });
});

function buildQueryChain(items: unknown[]): QueryChain {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    collation: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(items),
  };
}
