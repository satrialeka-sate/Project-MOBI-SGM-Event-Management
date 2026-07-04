export interface ScheduleQueryParams {
  month: number;
  year: number;
  regionId?: string;
  cycle?: string;
}

export interface SchedulePermitter {
  id: string;
  eventDate: string;
  venueName: string;
  venueAddress: string;
  regionName: string;
  cycle: string;
}

export interface ScheduleDay {
  date: number;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  isWeekend: boolean;
  permitters: SchedulePermitter[];
}

export interface ScheduleResponse {
  month: number;
  year: number;
  monthName: string;
  days: ScheduleDay[];
  totalDays: number;
  cycle?: string;
}
