import { UserRole } from "@prisma/client";
import type { ActorContext } from "@/types/auth";

/**
 * SYSTEM_ACTOR represents an internal system caller (Cron, Queue, CLI, etc.)
 * that has unrestricted access (scope: ALL) to all data.
 *
 * Use this when a service method needs to be called outside of an HTTP request
 * context but still requires an ActorContext parameter.
 *
 * Example:
 * ```ts
 * import { SYSTEM_ACTOR } from "@/constants/system";
 *
 * // In a cron job:
 * await eventService.list(SYSTEM_ACTOR, { page: 1, limit: 100 });
 * ```
 */
export const SYSTEM_ACTOR: ActorContext = {
  id: "__system__",
  role: UserRole.ADMIN,
  level: "SYSTEM",
  scope: "ALL",
  regionId: "",
};
