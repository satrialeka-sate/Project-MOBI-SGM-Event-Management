import { contactRepository } from "@/repositories/contact.repository";
import { eventRepository } from "@/repositories/event.repository";
import type {
  CreateContactInput,
  UpdateContactInput,
  ContactResponse,
  PaginatedResponse,
} from "@/types/contact";
import type { ActorContext } from "@/types/auth";
import { AppError } from "@/lib/errors";
import { canAccessRegion } from "@/lib/scope";

function toContactResponse(contact: {
  id: string;
  eventId: string;
  contactDate: Date;
  totalContact: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}): ContactResponse {
  return {
    id: contact.id,
    eventId: contact.eventId,
    contactDate: contact.contactDate.toISOString(),
    totalContact: contact.totalContact,
    createdBy: contact.createdBy,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export const contactService = {
  async list(
    actor: ActorContext,
    eventId: string,
    params: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<ContactResponse>> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const { page = 1, limit = 10 } = params;
    const { contacts, total } = await contactRepository.findByEventId({
      eventId,
      page,
      limit,
    });

    return {
      items: contacts.map(toContactResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async create(
    actor: ActorContext,
    eventId: string,
    data: CreateContactInput
  ): Promise<ContactResponse> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const contact = await contactRepository.create({
      eventId,
      totalContact: data.totalContact,
      createdBy: actor.id,
      contactDate: data.contactDate ? new Date(data.contactDate) : undefined,
    });

    return toContactResponse(contact);
  },

  async delete(
    actor: ActorContext,
    id: string
  ): Promise<void> {
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw new AppError("Contact not found", 404);
    }

    const event = await eventRepository.findById(existing.eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    await contactRepository.delete(id);
  },

  async update(
    actor: ActorContext,
    id: string,
    data: UpdateContactInput
  ): Promise<ContactResponse> {
    const existing = await contactRepository.findById(id);
    if (!existing) {
      throw new AppError("Contact not found", 404);
    }

    const event = await eventRepository.findById(existing.eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const updateData: Record<string, unknown> = {};
    if (data.totalContact !== undefined) updateData.totalContact = data.totalContact;
    if (data.contactDate) updateData.contactDate = new Date(data.contactDate);

    const contact = await contactRepository.update(id, updateData as Parameters<typeof contactRepository.update>[1]);
    return toContactResponse(contact);
  },
};
