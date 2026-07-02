import { masterProductRepository } from "@/repositories/master-product.repository";
import type {
  CreateMasterProductInput,
  MasterProductResponse,
  MasterProductQueryParams,
  PaginatedResponse,
} from "@/types/master-product";
import type { ActorContext } from "@/types/auth";
import { AppError } from "@/lib/errors";

function toMasterProductResponse(product: {
  id: string;
  productName: string;
  price: number;
  package: string;
  gimmick: string;
  createdAt: Date;
  updatedAt: Date;
}): MasterProductResponse {
  return {
    id: product.id,
    productName: product.productName,
    price: product.price,
    package: product.package,
    gimmick: product.gimmick,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export const masterProductService = {
  async list(
    _actor: ActorContext,
    params: MasterProductQueryParams
  ): Promise<PaginatedResponse<MasterProductResponse>> {
    const { page = 1, limit = 20 } = params;
    const { products, total } = await masterProductRepository.findAll(params);

    return {
      items: products.map(toMasterProductResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async search(_actor: ActorContext, search?: string): Promise<MasterProductResponse[]> {
    const products = await masterProductRepository.findAllForSearch(search);
    return products.map(toMasterProductResponse);
  },

  async getById(_actor: ActorContext, id: string): Promise<MasterProductResponse> {
    const product = await masterProductRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return toMasterProductResponse(product);
  },
};
