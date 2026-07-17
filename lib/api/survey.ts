import api from "@/lib/axios";
import type { ApiResponse, PaginatedData } from "./permitter";
import type {
  SurveyResponse,
  CreateSurveyInput,
  SurveyQueryParams,
  SurveyReport,
} from "@/types/survey";
import type { SurveyAiAnalysis } from "@/types/survey-ai";

export const surveyApi = {
  async list(params: SurveyQueryParams = {}) {
    const res = await api.get<ApiResponse<PaginatedData<SurveyResponse>>>("/surveys", { params });
    return res.data.data;
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<SurveyResponse>>(`/surveys/${id}`);
    return res.data.data;
  },

  async create(data: CreateSurveyInput) {
    const res = await api.post<ApiResponse<SurveyResponse>>("/surveys", data);
    return res.data.data;
  },

  async getReport(params: { eventId?: string; regionId?: string; startDate?: string; endDate?: string } = {}) {
    const res = await api.get<ApiResponse<SurveyReport>>("/surveys/report", { params });
    return res.data.data;
  },

  // ─── AI Analysis ───────────────────────────────────────────────────────

  /** Get cached AI analysis for an event */
  async getEventAiAnalysis(eventId: string): Promise<SurveyAiAnalysis | null> {
    const res = await api.get<ApiResponse<SurveyAiAnalysis | null>>(`/surveys/report/ai/event/${eventId}`);
    return res.data.data;
  },

  /** Generate AI analysis for an event */
  async generateEventAiAnalysis(eventId: string): Promise<SurveyAiAnalysis> {
    const res = await api.post<ApiResponse<SurveyAiAnalysis>>(`/surveys/report/ai/event/${eventId}`);
    return res.data.data;
  },

  /** Get cached AI analysis for a region */
  async getRegionAiAnalysis(regionId: string): Promise<SurveyAiAnalysis | null> {
    const res = await api.get<ApiResponse<SurveyAiAnalysis | null>>(`/surveys/report/ai/region/${regionId}`);
    return res.data.data;
  },

  /** Generate AI analysis for a region */
  async generateRegionAiAnalysis(regionId: string): Promise<SurveyAiAnalysis> {
    const res = await api.post<ApiResponse<SurveyAiAnalysis>>(`/surveys/report/ai/region/${regionId}`);
    return res.data.data;
  },

  /** Get cached AI analysis for all regions */
  async getAllAiAnalysis(): Promise<SurveyAiAnalysis | null> {
    const res = await api.get<ApiResponse<SurveyAiAnalysis | null>>("/surveys/report/ai/all");
    return res.data.data;
  },

  /** Generate AI analysis for all regions */
  async generateAllAiAnalysis(): Promise<SurveyAiAnalysis> {
    const res = await api.post<ApiResponse<SurveyAiAnalysis>>("/surveys/report/ai/all");
    return res.data.data;
  },
};
