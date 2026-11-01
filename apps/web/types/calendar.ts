export type CalendarStaff = {
  id: string;
  displayName: string;
};

export type CalendarBusinessHour = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export type CalendarStaffSchedule = {
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type CalendarBlockedRange = {
  staffId: string;
  startDateTime: string;
  endDateTime: string;
};

export type CalendarData = {
  locationId: string;
  year: number;
  month: number;
  staffs: CalendarStaff[];
  businessHours: CalendarBusinessHour[];
  staffSchedules: CalendarStaffSchedule[];
  blockedRanges: CalendarBlockedRange[];
};