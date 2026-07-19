"use client";

import { UserRole } from "@/constants/prisma-enums";
import { useSession } from "next-auth/react";
import { hasPermission, can } from "@/lib/permissions-ui";

/**
 * Hook that returns permission-checking utilities for the current user.
 *
 * Usage:
 *   const { canCreate, canEdit, canDelete } = usePermissions();
 *   if (canCreate) showCreateButton();
 */
export function usePermissions() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? UserRole.PERMITTER;

  return {
    /** The raw role */
    role,

    /** Check any permission by string (e.g. has("permitters.create")) */
    has: (permission: string) => hasPermission(role, permission),

    /** Convenience helpers per module */
    canReadPermitter: can.permitter.read(role),
    canCreatePermitter: can.permitter.create(role),
    canUpdatePermitter: can.permitter.update(role),
    canDeletePermitter: can.permitter.delete(role),

    canReadEvent: can.event.read(role),
    canCreateEvent: can.event.create(role),
    canUpdateEvent: can.event.update(role),
    canDeleteEvent: can.event.delete(role),

    canReadAttendance: can.attendance.read(role),
    canCreateAttendance: can.attendance.create(role),
    canUpdateAttendance: can.attendance.update(role),
    canDeleteAttendance: can.attendance.delete(role),

    canReadSelling: can.selling.read(role),
    canCreateSelling: can.selling.create(role),
    canUpdateSelling: can.selling.update(role),
    canDeleteSelling: can.selling.delete(role),

    canReadContact: can.contact.read(role),
    canCreateContact: can.contact.create(role),
    canUpdateContact: can.contact.update(role),
    canDeleteContact: can.contact.delete(role),

    canReadSurvey: can.survey.read(role),
    canCreateSurvey: can.survey.create(role),
    canUpdateSurvey: can.survey.update(role),
    canDeleteSurvey: can.survey.delete(role),
    canReadSurveyRegion: can.survey.readRegion(role),
    canReadSurveyAll: can.survey.readAll(role),

    canReadUser: can.user.read(role),
    canCreateUser: can.usersManagement.create(role),
    canUpdateUser: can.usersManagement.update(role),
    canDeleteUser: can.usersManagement.delete(role),
    canApproveUser: can.approval.approve(role),
    canRejectUser: can.approval.reject(role),
    canReadRegion: can.region.read(role),
    canReadReport: can.report.read(role),
    canReadSchedule: can.schedule.read(role),
  };
}
