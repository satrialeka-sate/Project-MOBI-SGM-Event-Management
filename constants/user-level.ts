export const USER_LEVELS = {
  PERMITTER: "PERMITTER",
  SPG: "SPG",
  TEAM_LEADER: "TEAM_LEADER",
  PIC: "PIC",
  PO: "PO",
} as const;

export type UserLevel = (typeof USER_LEVELS)[keyof typeof USER_LEVELS];
