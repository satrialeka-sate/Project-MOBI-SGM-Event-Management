import { sellingRepository } from "@/repositories/selling.repository";
import { eventRepository } from "@/repositories/event.repository";
import { masterProductRepository } from "@/repositories/master-product.repository";
import type {
  CreateSellingInput,
  UpdateSellingInput,
  SellingResponse,
  PaginatedResponse,
} from "@/types/selling";
import type { $Enums } from "../generated/prisma/client";
import type { ActorContext } from "@/types/auth";
import { AppError } from "@/lib/errors";
import { canAccessRegion } from "@/lib/scope";

function toSellingResponse(selling: {
  id: string;
  eventId: string;
  sellingDate: Date;
  previousMilk: $Enums.PreviousMilk;
  productId: string;
  productName: string;
  gimmick: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  product?: { id: string; productName: string; package: string; price: number; gimmick: string };
}): SellingResponse {
  return {
    id: selling.id,
    eventId: selling.eventId,
    sellingDate: selling.sellingDate.toISOString(),
    previousMilk: selling.previousMilk as SellingResponse["previousMilk"],
    productId: selling.productId,
    // Use snapshot fields for historical consistency
    productName: selling.productName,
    package: selling.product?.package ?? "",
    price: selling.product?.price ?? 0,
    gimmick: selling.gimmick,
    createdBy: selling.createdBy,
    createdAt: selling.createdAt.toISOString(),
    updatedAt: selling.updatedAt.toISOString(),
  };
}

export const sellingService = {
  async list(
    actor: ActorContext,
    eventId: string,
    params: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<SellingResponse>> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const { page = 1, limit = 10 } = params;
    const { sellings, total } = await sellingRepository.findByEventId({
      eventId,
      page,
      limit,
    });

    return {
      items: sellings.map(toSellingResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async create(
    actor: ActorContext,
    eventId: string,
    data: CreateSellingInput
  ): Promise<SellingResponse> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    // Validate product exists
    const product = await masterProductRepository.findById(data.productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const selling = await sellingRepository.create({
      eventId,
      previousMilk: data.previousMilk as $Enums.PreviousMilk,
      productId: data.productId,
      productName: product.productName,
      gimmick: product.gimmick,
      createdBy: actor.id,
      sellingDate: data.sellingDate ? new Date(data.sellingDate) : undefined,
    });

    return toSellingResponse(selling);
  },

  async delete(
    actor: ActorContext,
    id: string
  ): Promise<void> {
    const existing = await sellingRepository.findById(id);
    if (!existing) {
      throw new AppError("Selling not found", 404);
    }

    const event = await eventRepository.findById(existing.eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    await sellingRepository.delete(id);
  },

  async update(
    actor: ActorContext,
    id: string,
    data: UpdateSellingInput
  ): Promise<SellingResponse> {
    const existing = await sellingRepository.findById(id);
    if (!existing) {
      throw new AppError("Selling not found", 404);
    }

    const event = await eventRepository.findById(existing.eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    // If changing product, fetch snapshot and include productName + gimmick
    let updateData: Record<string, unknown> = {};
    if (data.previousMilk) updateData.previousMilk = data.previousMilk;
    if (data.sellingDate) updateData.sellingDate = new Date(data.sellingDate);

    if (data.productId) {
      const product = await masterProductRepository.findById(data.productId);
      if (!product) {
        throw new AppError("Product not found", 404);
      }
      updateData.productId = data.productId;
      updateData.productName = product.productName;
      updateData.gimmick = product.gimmick;
    }

    const selling = await sellingRepository.update(id, updateData as Parameters<typeof sellingRepository.update>[1]);
    return toSellingResponse(selling);
  },
};
