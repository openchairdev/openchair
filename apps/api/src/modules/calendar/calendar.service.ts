import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

import { GetLocationCalendarDto } from './dto/get-location-calendar.dto.js';

type AppointmentRow = {
  staffId: string;
  appointmentStart: Date;
  appointmentEnd: Date;
};

type TimeOffRow = {
  staffId: string;
  startDateTime: Date;
  endDateTime: Date;
};

type BusinessClosureRow = {
  startDateTime: Date;
  endDateTime: Date;
};

type StaffRow = {
  id: string;
  displayName: string;
};

type BlockedRange = {
  staffId: string;
  startDateTime: Date;
  endDateTime: Date;
};

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getLocationCalendar(
    locationId: string,
    query: GetLocationCalendarDto,
  ) {
    const { year, month } = query;

    const rangeStart = new Date(
      Date.UTC(year, month - 1, 1),
    );

    const rangeEnd = new Date(
      Date.UTC(year, month, 1),
    );

    const [
      staffs,
      businessHours,
      staffSchedules,
      businessClosures,
      timeOffs,
      appointments,
    ] = await Promise.all([
      this.prisma.staff.findMany({
        where: {
          locationId,
          isActive: true,
        },

        select: {
          id: true,
          displayName: true,
        },

        orderBy: {
          displayName: 'asc',
        },
      }),

      this.prisma.businessHour.findMany({
        where: {
          locationId,
        },

        select: {
          dayOfWeek: true,
          openTime: true,
          closeTime: true,
          isClosed: true,
        },

        orderBy: {
          dayOfWeek: 'asc',
        },
      }),

      this.prisma.staffSchedule.findMany({
        where: {
          staff: {
            locationId,
            isActive: true,
          },
        },

        select: {
          staffId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },

        orderBy: [
          {
            staffId: 'asc',
          },
          {
            dayOfWeek: 'asc',
          },
        ],
      }),

      this.prisma.businessClosure.findMany({
        where: {
          locationId,

          startDateTime: {
            lt: rangeEnd,
          },

          endDateTime: {
            gt: rangeStart,
          },
        },

        select: {
          startDateTime: true,
          endDateTime: true,
        },

        orderBy: {
          startDateTime: 'asc',
        },
      }),

      this.prisma.staffTimeOff.findMany({
        where: {
          staff: {
            locationId,
            isActive: true,
          },

          startDateTime: {
            lt: rangeEnd,
          },

          endDateTime: {
            gt: rangeStart,
          },
        },

        select: {
          staffId: true,
          startDateTime: true,
          endDateTime: true,
        },

        orderBy: {
          startDateTime: 'asc',
        },
      }),

      this.prisma.appointment.findMany({
        where: {
          locationId,

          appointmentStart: {
            lt: rangeEnd,
          },

          appointmentEnd: {
            gt: rangeStart,
          },
        },

        select: {
          staffId: true,
          appointmentStart: true,
          appointmentEnd: true,
        },

        orderBy: {
          appointmentStart: 'asc',
        },
      }),
    ]);

    const appointmentBlocks =
      (
        appointments as AppointmentRow[]
      ).map(
        (
          appointment: AppointmentRow,
        ): BlockedRange => ({
          staffId: appointment.staffId,
          startDateTime:
            appointment.appointmentStart,
          endDateTime:
            appointment.appointmentEnd,
        }),
      );

    const timeOffBlocks =
      (
        timeOffs as TimeOffRow[]
      ).map(
        (
          timeOff: TimeOffRow,
        ): BlockedRange => ({
          staffId: timeOff.staffId,
          startDateTime:
            timeOff.startDateTime,
          endDateTime:
            timeOff.endDateTime,
        }),
      );

    const businessClosureBlocks =
      (
        businessClosures as BusinessClosureRow[]
      ).flatMap(
        (
          closure: BusinessClosureRow,
        ): BlockedRange[] =>
          (
            staffs as StaffRow[]
          ).map(
            (
              staff: StaffRow,
            ): BlockedRange => ({
              staffId: staff.id,
              startDateTime:
                closure.startDateTime,
              endDateTime:
                closure.endDateTime,
            }),
          ),
      );

    const blockedRanges: BlockedRange[] = [
      ...appointmentBlocks,
      ...timeOffBlocks,
      ...businessClosureBlocks,
    ].sort(
      (
        left: BlockedRange,
        right: BlockedRange,
      ) =>
        left.startDateTime.getTime() -
        right.startDateTime.getTime(),
    );

    return {
      locationId,
      year,
      month,
      staffs,
      businessHours,
      staffSchedules,
      blockedRanges,
    };
  }
}