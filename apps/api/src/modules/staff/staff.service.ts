import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

import { CreateStaffScheduleDto } from './dto/create-staff-schedule.dto.js';
import { CreateStaffTimeOffDto } from './dto/create-staff-time-off.dto.js';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createSchedule(
    staffId: string,
    dto: CreateStaffScheduleDto,
  ) {
    return this.prisma.staffSchedule.create({
      data: {
        staffId,

        dayOfWeek: dto.dayOfWeek,

        startTime: dto.startTime,

        endTime: dto.endTime,
      },
    });
  }

  async findSchedules(
    staffId: string,
  ) {
    return this.prisma.staffSchedule.findMany({
      where: {
        staffId,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });
  }

  async createTimeOff(
    staffId: string,
    dto: CreateStaffTimeOffDto,
  ) {
    return this.prisma.staffTimeOff.create({
      data: {
        staffId,

        startDateTime: new Date(
            dto.startDateTime,
        ),

        endDateTime: new Date(
            dto.endDateTime,
        ),

        reason: dto.reason,
      },
    });
  }  

  async findTimeOff(
    staffId: string,
  ) {
    return this.prisma.staffTimeOff.findMany({
      where: {
        staffId,
      },

      orderBy: {
        startDateTime: 'asc',
      },
    });
  }  
}