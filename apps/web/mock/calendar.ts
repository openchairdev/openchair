import { CalendarData } from '../types/calendar';

export const calendar: CalendarData = {
  year: 2027,

  month: 3,

  locationId:
    'a730e156-607b-4e9d-88dc-7ef9fc6f9ffb',

  staffs: [
    {
      id: 'amy',
      displayName: 'Amy',
    },

    {
      id: 'mike',
      displayName: 'Mike',
    },

    {
      id: 'sarah',
      displayName: 'Sarah',
    },
  ],

  businessHours: [
    {
      dayOfWeek: 1,
      openTime: '09:00',
      closeTime: '18:00',
      isClosed: false,
    },
  ],

  staffSchedules: [
    {
        staffId: 'amy',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '18:00',
    },
    {
        staffId: 'amy',
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '18:00',
    },
    {
        staffId: 'amy',
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '18:00',
    },
    {
        staffId: 'amy',
        dayOfWeek: 4,
        startTime: '09:00',
        endTime: '18:00',
    },
    {
        staffId: 'amy',
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '18:00',
    },
  ],

  blockedRanges: [
    {
      staffId: 'amy',
      startDateTime: '2027-03-15T10:00:00',
      endDateTime: '2027-03-15T10:30:00',
    },

    {
      staffId: 'mike',
      startDateTime: '2027-03-15T13:00:00',
      endDateTime: '2027-03-15T14:00:00',
    },
  ],
};