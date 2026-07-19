export const SURVEY_PERMISSIONS = {
  CREATE: "surveys.create",
  READ: "surveys.read",
  UPDATE: "surveys.update",
  DELETE: "surveys.delete",
  READ_REGION: "surveys.read_region",
  READ_ALL: "surveys.read_all",
} as const;

export type SurveyPermission = (typeof SURVEY_PERMISSIONS)[keyof typeof SURVEY_PERMISSIONS];
