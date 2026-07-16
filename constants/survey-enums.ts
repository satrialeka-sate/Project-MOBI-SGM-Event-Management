/**
 * Survey answer enum values that mirror @prisma/client's enums.
 *
 * This exists to break the dependency chain:
 *   client-component → constants/survey-enums → @prisma/client → ❌ Prisma bundled in browser
 */
export const SurveyProfession = {
  IBU_RUMAH_TANGGA: "IBU_RUMAH_TANGGA" as const,
  WIRAUSAHA_UMKM: "WIRAUSAHA_UMKM" as const,
  PROFESIONAL: "PROFESIONAL" as const,
  PEKERJA: "PEKERJA" as const,
} as const;
export type SurveyProfession = (typeof SurveyProfession)[keyof typeof SurveyProfession];

export const SurveyNotBuyingReason = {
  PAKET_TIDAK_MENARIK: "PAKET_TIDAK_MENARIK" as const,
  ANAK_TIDAK_MINUM_SUSU: "ANAK_TIDAK_MINUM_SUSU" as const,
  ANAK_SUDAH_MINUM_MERK_LAIN: "ANAK_SUDAH_MINUM_MERK_LAIN" as const,
  TIDAK_MEMBAWA_UANG: "TIDAK_MEMBAWA_UANG" as const,
} as const;
export type SurveyNotBuyingReason = (typeof SurveyNotBuyingReason)[keyof typeof SurveyNotBuyingReason];

export const SurveyBuyingReason = {
  MENDAPATKAN_HADIAH_GIMMICK: "MENDAPATKAN_HADIAH_GIMMICK" as const,
  ANAK_SUKA_RASA_SGM: "ANAK_SUKA_RASA_SGM" as const,
  MENAMBAH_ASUPAN_GIZI: "MENAMBAH_ASUPAN_GIZI" as const,
} as const;
export type SurveyBuyingReason = (typeof SurveyBuyingReason)[keyof typeof SurveyBuyingReason];

export const SurveyPackage = {
  PAKET_1: "PAKET_1" as const,
  PAKET_2: "PAKET_2" as const,
  PAKET_3: "PAKET_3" as const,
  TIDAK_MEMBELI: "TIDAK_MEMBELI" as const,
} as const;
export type SurveyPackage = (typeof SurveyPackage)[keyof typeof SurveyPackage];

export const SurveyFavoriteActivity = {
  STORY_TELLING: "STORY_TELLING" as const,
  BOUNCY_CASTLE: "BOUNCY_CASTLE" as const,
  MINI_PERPPUSTAKAAN: "MINI_PERPPUSTAKAAN" as const,
  METAMORPHOSIS_PUZZLE: "METAMORPHOSIS_PUZZLE" as const,
  WORKSHOP_PRAKARYA: "WORKSHOP_PRAKARYA" as const,
  DOOR_PRIZE: "DOOR_PRIZE" as const,
} as const;
export type SurveyFavoriteActivity = (typeof SurveyFavoriteActivity)[keyof typeof SurveyFavoriteActivity];

export const SurveyMemorableImpression = {
  MOBIL_SGM: "MOBIL_SGM" as const,
  SGM_RUANG_TUMBUH_LEBIH: "SGM_RUANG_TUMBUH_LEBIH" as const,
  PAKET_PENJUALAN_MENARIK: "PAKET_PENJUALAN_MENARIK" as const,
  BANYAK_PERMAINAN_ANAK: "BANYAK_PERMAINAN_ANAK" as const,
} as const;
export type SurveyMemorableImpression = (typeof SurveyMemorableImpression)[keyof typeof SurveyMemorableImpression];

export const SurveyCrewImpression = {
  MENYENANGKAN_DAN_RAMAH: "MENYENANGKAN_DAN_RAMAH" as const,
  TERLALU_PENDIAM: "TERLALU_PENDIAM" as const,
  BANYAK_BERCANDA: "BANYAK_BERCANDA" as const,
} as const;
export type SurveyCrewImpression = (typeof SurveyCrewImpression)[keyof typeof SurveyCrewImpression];

// ─── Display labels for survey questions ─────────────────────────────────

export const SURVEY_PROFESSION_LABELS: Record<SurveyProfession, string> = {
  IBU_RUMAH_TANGGA: "Ibu Rumah Tangga",
  WIRAUSAHA_UMKM: "Wirausaha / UMKM",
  PROFESIONAL: "Profesional",
  PEKERJA: "Pekerja",
};

export const SURVEY_NOT_BUYING_REASON_LABELS: Record<SurveyNotBuyingReason, string> = {
  PAKET_TIDAK_MENARIK: "Paket tidak menarik",
  ANAK_TIDAK_MINUM_SUSU: "Anak tidak minum susu",
  ANAK_SUDAH_MINUM_MERK_LAIN: "Anak sudah minum susu merk lain",
  TIDAK_MEMBAWA_UANG: "Tidak membawa uang",
};

export const SURVEY_BUYING_REASON_LABELS: Record<SurveyBuyingReason, string> = {
  MENDAPATKAN_HADIAH_GIMMICK: "Mendapatkan hadiah & gimmick acara",
  ANAK_SUKA_RASA_SGM: "Anak saya suka dengan rasa susu SGM",
  MENAMBAH_ASUPAN_GIZI: "Untuk menambah asupan gizi anak",
};

export const SURVEY_PACKAGE_LABELS: Record<SurveyPackage, string> = {
  PAKET_1: "Paket 1",
  PAKET_2: "Paket 2",
  PAKET_3: "Paket 3",
  TIDAK_MEMBELI: "Tidak Membeli",
};

export const SURVEY_FAVORITE_ACTIVITY_LABELS: Record<SurveyFavoriteActivity, string> = {
  STORY_TELLING: "Story Telling",
  BOUNCY_CASTLE: "Bouncy Castle",
  MINI_PERPPUSTAKAAN: "Mini Perpustakaan",
  METAMORPHOSIS_PUZZLE: "Metamorphosis Puzzle Magnet Ulat dan Kupu-kupu",
  WORKSHOP_PRAKARYA: "Workshop / Prakarya",
  DOOR_PRIZE: "DoorPrize",
};

export const SURVEY_MEMORABLE_IMPRESSION_LABELS: Record<SurveyMemorableImpression, string> = {
  MOBIL_SGM: "Mobil SGM",
  SGM_RUANG_TUMBUH_LEBIH: "SGM Ruang Tumbuh Lebih",
  PAKET_PENJUALAN_MENARIK: "Paket Penjualan yang Menarik",
  BANYAK_PERMAINAN_ANAK: "Banyak Permainan Untuk Anak-anak",
};

export const SURVEY_CREW_IMPRESSION_LABELS: Record<SurveyCrewImpression, string> = {
  MENYENANGKAN_DAN_RAMAH: "Menyenangkan dan Ramah",
  TERLALU_PENDIAM: "Terlalu Pendiam",
  BANYAK_BERCANDA: "Banyak Bercanda",
};
