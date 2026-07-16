import type {
  SurveyProfession,
  SurveyNotBuyingReason,
  SurveyBuyingReason,
  SurveyPackage,
  SurveyFavoriteActivity,
  SurveyMemorableImpression,
  SurveyCrewImpression,
} from "@/constants/survey-enums";

/** Single survey record */
export interface SurveyResponse {
  id: string;
  eventId: string;
  regionId: string;
  regionName: string;
  eventName: string;
  surveyDate: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;

  // Question 1
  profession: SurveyProfession;
  // Question 2
  notBuyingReason: SurveyNotBuyingReason;
  // Question 3
  buyingReason: SurveyBuyingReason;
  // Question 4
  package: SurveyPackage;
  // Question 5
  favoriteActivity: SurveyFavoriteActivity;
  // Question 6
  memorableImpression: SurveyMemorableImpression;
  // Question 7
  crewImpression: SurveyCrewImpression;
}

/** Input for creating a survey */
export interface CreateSurveyInput {
  eventId: string;
  profession: SurveyProfession;
  notBuyingReason: SurveyNotBuyingReason;
  buyingReason: SurveyBuyingReason;
  package: SurveyPackage;
  favoriteActivity: SurveyFavoriteActivity;
  memorableImpression: SurveyMemorableImpression;
  crewImpression: SurveyCrewImpression;
}

/** Query params for listing surveys */
export interface SurveyQueryParams {
  page?: number;
  limit?: number;
  eventId?: string;
  regionId?: string;
  startDate?: string;
  endDate?: string;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Stat item for a single answer option */
export interface AnswerStat {
  label: string;
  value: string;
  count: number;
  percentage: number;
}

/** Stats for a single question */
export interface QuestionStat {
  questionKey: string;
  questionLabel: string;
  answers: AnswerStat[];
}

/** Survey report response */
export interface SurveyReport {
  totalSurveys: number;
  totalEvents: number;
  totalRegions: number;
  startDate: string;
  endDate: string;
  questions: QuestionStat[];
}
