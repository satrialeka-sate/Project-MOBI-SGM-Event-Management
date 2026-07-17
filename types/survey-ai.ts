/** Result from OpenAI analysis */
export interface SurveyAiResult {
  executiveSummary: string;
  keyInsights: string[];
  recommendations: string[];
  anomalies: string[];
}

/** SurveyAiAnalysis record from database */
export interface SurveyAiAnalysis {
  id: string;
  scope: "EVENT" | "REGION" | "ALL";
  eventId: string | null;
  regionId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  executiveSummary: string;
  keyInsights: string[];
  recommendations: string[];
  anomalies: string[];
  generatedAt: string;
  generatedBy: string | null;
}

/** Aggregate data sent to OpenAI (no PII) */
export interface SurveyAiAggregatePayload {
  totalSurveys: number;
  totalEvents: number;
  totalRegions: number;
  periodStart: string;
  periodEnd: string;
  profession: Record<string, number>;
  purchaseReason: Record<string, number>;
  noPurchaseReason: Record<string, number>;
  packageBought: Record<string, number>;
  favoriteActivity: Record<string, number>;
  memorableImpression: Record<string, number>;
  crewImpression: Record<string, number>;
}

/** Query params for AI report */
export interface SurveyAiQueryParams {
  eventId?: string;
  regionId?: string;
}
