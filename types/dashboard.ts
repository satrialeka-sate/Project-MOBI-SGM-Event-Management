export interface TodayEventResponse {
  id: string;
  eventId: string | null;
  eventDate: Date;
  status: string;
  region: string;
  cycle: string;
  venue: {
    name: string;
    address: string;
    pic: string;
  };
  spg: {
    id: string;
    name: string;
    email: string;
  } | null;
  schools: Array<{
    name: string;
    address: string;
    totalStudents: number;
    picName: string;
    picPhone: string;
  }>;
}
