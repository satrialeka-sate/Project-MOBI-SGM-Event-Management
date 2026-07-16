export const SURVEY_PERMISSIONS = {
  CREATE: "surveys.create",
  READ: "surveys.read",
  READ_REGION: "surveys.read_region",
  READ_ALL: "surveys.read_all",
} as const;

export type SurveyPermission = (typeof SURVEY_PERMISSIONS)[keyof typeof SURVEY_PERMISSIONS];
