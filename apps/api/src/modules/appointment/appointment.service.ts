import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { ValidateAppointmentDto } from './dto/validate-appointment.dto.js';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async validate(
    dto: ValidateAppointmentDto,
  ) {
    const service =
      await this.prisma.service.findUnique({
        where: {
          id: dto.serviceId,
        },
      });

    if (!service) {
      return {
        valid: false,
        reason: 'Service not found',
      };
    }

    const appointmentStart =
      new Date(
        `${dto.appointmentDate}T${dto.startTime}:00`,
      );

    const appointmentEnd =
      new Date(
        appointmentStart.getTime() +
          service.durationMinutes *
            60 *
            1000,
      );

    const schedule =
      await this.prisma.staffSchedule.findFirst({
        where: {
          staffId: dto.staffId,
          dayOfWeek:
            appointmentStart.getDay(),
        },

        include: {
          staff: true,
        },
      });

    if (!schedule) {
      return {
        valid: false,
        reason:
          'Staff has no schedule for this day',
      };
    }

    const scheduleStart =
      new Date(
        `${dto.appointmentDate}T${schedule.startTime}:00`,
      );

    const scheduleEnd =
      new Date(
        `${dto.appointmentDate}T${schedule.endTime}:00`,
      );

    if (
      appointmentStart < scheduleStart ||
      appointmentEnd > scheduleEnd
    ) {
      return {
        valid: false,
        reason:
          'Appointment falls outside staff schedule',
      };
    }

    const businessHour =
      await this.prisma.businessHour.findFirst({
        where: {
          locationId:
            schedule.staff.locationId,

          dayOfWeek:
            appointmentStart.getDay(),
        },
      });

    if (
      !businessHour ||
      businessHour.isClosed
    ) {
      return {
        valid: false,
        reason: 'Business is closed',
      };
    }

    const businessOpen =
      new Date(
        `${dto.appointmentDate}T${businessHour.openTime}:00`,
      );

    const businessClose =
      new Date(
        `${dto.appointmentDate}T${businessHour.closeTime}:00`,
      );

    if (
      appointmentStart < businessOpen ||
      appointmentEnd > businessClose
    ) {
      return {
        valid: false,
        reason:
          'Appointment falls outside business hours',
      };
    }

    const closure =
      await this.prisma.businessClosure.findFirst({
        where: {
          locationId:
            schedule.staff.locationId,

          startDateTime: {
            lt: appointmentEnd,
          },

          endDateTime: {
            gt: appointmentStart,
          },
        },
      });

    if (closure) {
      return {
        valid: false,
        reason: closure.title,
      };
    }

    const timeOff =
      await this.prisma.staffTimeOff.findFirst({
        where: {
          staffId: dto.staffId,

          startDateTime: {
            lt: appointmentEnd,
          },

          endDateTime: {
            gt: appointmentStart,
          },
        },
      });

    if (timeOff) {
      return {
        valid: false,
        reason:
          'Staff is unavailable during this period',
      };
    }

    const conflict =
      await this.prisma.appointment.findFirst({
        where: {
          staffId: dto.staffId,

          appointmentStart: {
            lt: appointmentEnd,
          },

          appointmentEnd: {
            gt: appointmentStart,
          },
        },
      });

    if (conflict) {
      return {
        valid: false,
        reason:
          'Appointment overlaps existing booking',
      };
    }

    return {
      valid: true,
      appointmentStart,
      appointmentEnd,
    };
  }

  async create(
    dto: CreateAppointmentDto,
  ) {
    const validation =
      await this.validate({
        staffId: dto.staffId,
        serviceId: dto.serviceId,
        appointmentDate:
          dto.appointmentDate,
        startTime: dto.startTime,
      });

    if (!validation.valid) {
      return validation;
    }

    const service =
      await this.prisma.service.findUnique({
        where: {
          id: dto.serviceId,
        },
      });

    const staff =
      await this.prisma.staff.findUnique({
        where: {
          id: dto.staffId,
        },
      });

    if (!service || !staff) {
      return {
        success: false,
        reason:
          'Invalid service or staff',
      };
    }

    const appointmentStart =
      validation.appointmentStart!;

    const appointmentEnd =
      validation.appointmentEnd!;

    const appointment =
      await this.prisma.appointment.create({
        data: {
          locationId:
            staff.locationId,

          serviceId:
            service.id,

          staffId:
            staff.id,

          customerId:
            dto.customerId,

          appointmentStart,

          appointmentEnd,

          status: 'CONFIRMED',

          notes: dto.notes,
        },
      });

    return {
      success: true,
      appointment,
    };
  }
}