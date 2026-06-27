import { venueRepository } from "@/repositories/venue.repository";
import type { CreateVenueInput, UpdateVenueInput, VenueQueryParams, VenueResponse, PaginatedResponse } from "@/types/venue";
import { AppError } from "@/lib/errors";

function toVenueResponse(venue: {
  id: string;
  name: string;
  kota: string;
  alamat: string;
  picVenue: string;
  regionId: string;
  createdAt: Date;
  updatedAt: Date;
  region: { name: string };
}): VenueResponse {
  return {
    id: venue.id,
    name: venue.name,
    kota: venue.kota,
    alamat: venue.alamat,
    picVenue: venue.picVenue,
    regionId: venue.regionId,
    regionName: venue.region.name,
    createdAt: venue.createdAt,
    updatedAt: venue.updatedAt,
  };
}

export const venueService = {
  async list(params: VenueQueryParams): Promise<PaginatedResponse<VenueResponse>> {
    const { page = 1, limit = 10 } = params;
    const { venues, total } = await venueRepository.findAll(params);

    return {
      items: venues.map(toVenueResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string): Promise<VenueResponse> {
    const venue = await venueRepository.findById(id);
    if (!venue) {
      throw new AppError("Venue not found", 404);
    }
    return toVenueResponse(venue);
  },

  async create(data: CreateVenueInput): Promise<VenueResponse> {
    const existing = await venueRepository.findByNameAndRegion(data.name, data.regionId);
    if (existing) {
      throw new AppError("Venue already exists in this region", 409, [
        `A venue named "${data.name}" already exists in the selected region`,
      ]);
    }

    const venue = await venueRepository.create(data);
    return toVenueResponse(venue);
  },

  async update(id: string, data: UpdateVenueInput): Promise<VenueResponse> {
    const existing = await venueRepository.findById(id);
    if (!existing) {
      throw new AppError("Venue not found", 404);
    }

    // If name or regionId is being changed, check for duplicates
    const newName = data.name ?? existing.name;
    const newRegionId = data.regionId ?? existing.regionId;
    if (data.name || data.regionId) {
      const duplicate = await venueRepository.findByNameAndRegion(newName, newRegionId);
      if (duplicate && duplicate.id !== id) {
        throw new AppError("Venue already exists in this region", 409, [
          `A venue named "${newName}" already exists in the selected region`,
        ]);
      }
    }

    const venue = await venueRepository.update(id, data);
    return toVenueResponse(venue);
  },

  async delete(id: string): Promise<void> {
    const existing = await venueRepository.findById(id);
    if (!existing) {
      throw new AppError("Venue not found", 404);
    }

    await venueRepository.delete(id);
  },
};
