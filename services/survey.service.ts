import { surveyRepository } from "@/repositories/survey.repository";
import { eventRepository } from "@/repositories/event.repository";
import type { ActorContext } from "@/types/auth";
import type { CreateSurveyInput, SurveyQueryParams, SurveyResponse, PaginatedResponse, SurveyReport, QuestionStat, AnswerStat } from "@/types/survey";
import { AppError } from "@/lib/errors";
import { canAccessRegion, applyRegionFilter } from "@/lib/scope";
import {
  SurveyProfession,
  SurveyNotBuyingReason,
  SurveyBuyingReason,
  SurveyPackage,
  SurveyFavoriteActivity,
  SurveyMemorableImpression,
  SurveyCrewImpression,
  SURVEY_PROFESSION_LABELS,
  SURVEY_NOT_BUYING_REASON_LABELS,
  SURVEY_BUYING_REASON_LABELS,
  SURVEY_PACKAGE_LABELS,
  SURVEY_FAVORITE_ACTIVITY_LABELS,
  SURVEY_MEMORABLE_IMPRESSION_LABELS,
  SURVEY_CREW_IMPRESSION_LABELS,
} from "@/constants/survey-enums";
import { SURVEY_PERMISSIONS } from "@/constants/survey-permissions";
import { hasPermission } from "@/lib/rbac";

function toSurveyResponse(survey: {
  id: string;
  eventId: string;
  regionId: string;
  surveyDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  profession: string;
  notBuyingReason: string;
  buyingReason: string;
  package: string;
  favoriteActivity: string;
  memorableImpression: string;
  crewImpression: string;
  event: { id: string; venueName: string };
  region: { id: string; name: string };
  user: { id: string; name: string };
}): SurveyResponse {
  return {
    id: survey.id,
    eventId: survey.eventId,
    regionId: survey.regionId,
    regionName: survey.region.name,
    eventName: survey.event.venueName,
    surveyDate: survey.surveyDate.toISOString(),
    createdBy: survey.createdBy,
    createdByName: survey.user.name,
    createdAt: survey.createdAt.toISOString(),
    updatedAt: survey.updatedAt.toISOString(),
    profession: survey.profession as SurveyResponse["profession"],
    notBuyingReason: survey.notBuyingReason as SurveyResponse["notBuyingReason"],
    buyingReason: survey.buyingReason as SurveyResponse["buyingReason"],
    package: survey.package as SurveyResponse["package"],
    favoriteActivity: survey.favoriteActivity as SurveyResponse["favoriteActivity"],
    memorableImpression: survey.memorableImpression as SurveyResponse["memorableImpression"],
    crewImpression: survey.crewImpression as SurveyResponse["crewImpression"],
  };
}

// Question definitions for report generation
interface QuestionDef {
  key: string;
  label: string;
  field: string;
  labels: Record<string, string>;
}

const QUESTIONS: QuestionDef[] = [
  {
    key: "profession",
    label: "Apakah Profesi Bunda?",
    field: "profession",
    labels: SURVEY_PROFESSION_LABELS as unknown as Record<string, string>,
  },
  {
    key: "notBuyingReason",
    label: "Jika tidak membeli, apa alasan Bunda?",
    field: "notBuyingReason",
    labels: SURVEY_NOT_BUYING_REASON_LABELS as unknown as Record<string, string>,
  },
  {
    key: "buyingReason",
    label: "Apa yang membuat Bunda membeli produk SGM Eksplor?",
    field: "buyingReason",
    labels: SURVEY_BUYING_REASON_LABELS as unknown as Record<string, string>,
  },
  {
    key: "package",
    label: "Paket yang Bunda beli di acara ini",
    field: "package",
    labels: SURVEY_PACKAGE_LABELS as unknown as Record<string, string>,
  },
  {
    key: "favoriteActivity",
    label: "Aktivitas apa yang paling disukai selama event?",
    field: "favoriteActivity",
    labels: SURVEY_FAVORITE_ACTIVITY_LABELS as unknown as Record<string, string>,
  },
  {
    key: "memorableImpression",
    label: "Kesan yang paling diingat dari Event SGM Ruang Tumbuh Lebih",
    field: "memorableImpression",
    labels: SURVEY_MEMORABLE_IMPRESSION_LABELS as unknown as Record<string, string>,
  },
  {
    key: "crewImpression",
    label: "Bagaimana kesan Bunda terhadap Kru (Man Power) Event?",
    field: "crewImpression",
    labels: SURVEY_CREW_IMPRESSION_LABELS as unknown as Record<string, string>,
  },
];

function computeStats(surveys: any[], question: QuestionDef): QuestionStat {
  const total = surveys.length;
  const countMap: Record<string, number> = {};

  // Initialize all options with 0
  for (const value of Object.keys(question.labels)) {
    countMap[value] = 0;
  }

  // Count answers
  for (const survey of surveys) {
    const answer = survey[question.field];
    if (answer && countMap[answer] !== undefined) {
      countMap[answer]++;
    }
  }

  const answers: AnswerStat[] = Object.entries(countMap)
    .map(([value, count]) => ({
      label: question.labels[value] || value,
      value,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    questionKey: question.key,
    questionLabel: question.label,
    answers,
  };
}

export const surveyService = {
  async list(actor: ActorContext, params: SurveyQueryParams): Promise<PaginatedResponse<SurveyResponse>> {
    const filteredParams = applyRegionFilter(params, actor);
    const { page = 1, limit = 10 } = filteredParams;

    const { surveys, total } = await surveyRepository.findAll({
      ...filteredParams,
      createdBy: actor.role === "SPG" ? actor.id : undefined,
    });

    return {
      items: surveys.map(toSurveyResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(actor: ActorContext, id: string): Promise<SurveyResponse> {
    const survey = await surveyRepository.findById(id);
    if (!survey) {
      throw new AppError("Survey not found", 404);
    }

    if (!canAccessRegion(actor.regionId, survey.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this survey", 403);
    }

    return toSurveyResponse(survey);
  },

  async create(actor: ActorContext, data: CreateSurveyInput): Promise<SurveyResponse> {
    // Verify the event exists
    const event = await eventRepository.findById(data.eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const survey = await surveyRepository.create({
      eventId: data.eventId,
      regionId: event.regionId,
      createdBy: actor.id,
      profession: data.profession,
      notBuyingReason: data.notBuyingReason,
      buyingReason: data.buyingReason,
      package: data.package,
      favoriteActivity: data.favoriteActivity,
      memorableImpression: data.memorableImpression,
      crewImpression: data.crewImpression,
    });

    return toSurveyResponse(survey);
  },

  async getReport(
    actor: ActorContext,
    params: { eventId?: string; regionId?: string; startDate?: string; endDate?: string }
  ): Promise<SurveyReport> {
    // Determine effective region filter based on permission
    let effectiveRegionId = params.regionId;

    // If user has REGION scope, force filter to their region
    if (actor.scope === "REGION") {
      effectiveRegionId = actor.regionId;
    }

    const surveys = await surveyRepository.getReportStats({
      ...params,
      regionId: effectiveRegionId,
    });

    if (surveys.length === 0) {
      return {
        totalSurveys: 0,
        totalEvents: 0,
        totalRegions: 0,
        startDate: params.startDate || "",
        endDate: params.endDate || "",
        questions: QUESTIONS.map((q) => ({
          questionKey: q.key,
          questionLabel: q.label,
          answers: Object.entries(q.labels).map(([value, label]) => ({
            label,
            value,
            count: 0,
            percentage: 0,
          })),
        })),
      };
    }

    // Compute summary
    const uniqueEvents = new Set(surveys.map((s) => s.eventId));
    const uniqueRegions = new Set(surveys.map((s) => s.regionId));

    const dates = surveys.map((s) => s.surveyDate.getTime());
    const startDate = new Date(Math.min(...dates)).toISOString();
    const endDate = new Date(Math.max(...dates)).toISOString();

    // Compute stats for each question
    const questions = QUESTIONS.map((q) => computeStats(surveys, q));

    return {
      totalSurveys: surveys.length,
      totalEvents: uniqueEvents.size,
      totalRegions: uniqueRegions.size,
      startDate,
      endDate,
      questions,
    };
  },
};
