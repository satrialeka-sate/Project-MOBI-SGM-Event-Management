export const USER_SCOPES = {
  REGION: "REGION",
  ALL: "ALL",
} as const;

export type UserScope = (typeof USER_SCOPES)[keyof typeof USER_SCOPES];
