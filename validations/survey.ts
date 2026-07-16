import { z } from "zod/v4";
import type { SurveyProfession, SurveyNotBuyingReason, SurveyBuyingReason, SurveyPackage, SurveyFavoriteActivity, SurveyMemorableImpression, SurveyCrewImpression } from "@/constants/survey-enums";

export const surveyProfessionSchema = z.enum([
  "IBU_RUMAH_TANGGA",
  "WIRAUSAHA_UMKM",
  "PROFESIONAL",
  "PEKERJA",
]);

export const surveyNotBuyingReasonSchema = z.enum([
  "PAKET_TIDAK_MENARIK",
  "ANAK_TIDAK_MINUM_SUSU",
  "ANAK_SUDAH_MINUM_MERK_LAIN",
  "TIDAK_MEMBAWA_UANG",
]);

export const surveyBuyingReasonSchema = z.enum([
  "MENDAPATKAN_HADIAH_GIMMICK",
  "ANAK_SUKA_RASA_SGM",
  "MENAMBAH_ASUPAN_GIZI",
]);

export const surveyPackageSchema = z.enum([
  "PAKET_1",
  "PAKET_2",
  "PAKET_3",
  "TIDAK_MEMBELI",
]);

export const surveyFavoriteActivitySchema = z.enum([
  "STORY_TELLING",
  "BOUNCY_CASTLE",
  "MINI_PERPPUSTAKAAN",
  "METAMORPHOSIS_PUZZLE",
  "WORKSHOP_PRAKARYA",
  "DOOR_PRIZE",
]);

export const surveyMemorableImpressionSchema = z.enum([
  "MOBIL_SGM",
  "SGM_RUANG_TUMBUH_LEBIH",
  "PAKET_PENJUALAN_MENARIK",
  "BANYAK_PERMAINAN_ANAK",
]);

export const surveyCrewImpressionSchema = z.enum([
  "MENYENANGKAN_DAN_RAMAH",
  "TERLALU_PENDIAM",
  "BANYAK_BERCANDA",
]);

export const createSurveySchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  profession: surveyProfessionSchema,
  notBuyingReason: surveyNotBuyingReasonSchema,
  buyingReason: surveyBuyingReasonSchema,
  package: surveyPackageSchema,
  favoriteActivity: surveyFavoriteActivitySchema,
  memorableImpression: surveyMemorableImpressionSchema,
  crewImpression: surveyCrewImpressionSchema,
});

export const surveyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  eventId: z.string().optional(),
  regionId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const surveyReportQuerySchema = z.object({
  eventId: z.string().optional(),
  regionId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type SurveyQueryInput = z.infer<typeof surveyQuerySchema>;
export type SurveyReportQueryInput = z.infer<typeof surveyReportQuerySchema>;
