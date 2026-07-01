/**
 * ActorContext represents the authenticated user's identity
 * passed from the transport layer (HTTP, Cron, CLI, Queue, etc.)
 * to the service layer for access control and audit purposes.
 *
 * This is intentionally separate from NextAuth's Session.User
 * to keep the service layer agnostic of the HTTP auth framework.
 */
import type { UserRole } from "@/constants/prisma-enums";

export interface ActorContext {
  /** User's unique identifier */
  id: string;
  /** User's role (e.g., ADMIN, SUPERVISOR, PERMITTER, SPG) */
  role: UserRole;
  /** User's hierarchical level (e.g., PIC, PO, TEAM_LEADER, SPG, PERMITTER) */
  level: string;
  /** User's data access scope (e.g., REGION, ALL) */
  scope: string;
  /** The region the user belongs to */
  regionId: string;
}
