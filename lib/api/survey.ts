import api from "@/lib/axios";
import type { ApiResponse, PaginatedData } from "./permitter";
import type {
  SurveyResponse,
  CreateSurveyInput,
  SurveyQueryParams,
  SurveyReport,
} from "@/types/survey";

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
};
