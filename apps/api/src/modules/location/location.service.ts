import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

import { CreateBusinessClosureDto } from './dto/create-business-closure.dto.js';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto.js';

@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createBusinessHour(
    locationId: string,
    dto: CreateBusinessHourDto,
  ) {
    return this.prisma.businessHour.upsert({
      where: {
        locationId_dayOfWeek: {
          locationId,
          dayOfWeek: dto.dayOfWeek,
        },
      },

      create: {
        locationId,
        dayOfWeek: dto.dayOfWeek,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        isClosed: dto.isClosed ?? false,
      },

      update: {
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        isClosed: dto.isClosed ?? false,
      },
    });
  }

  async findBusinessHours(
    locationId: string,
  ) {
    return this.prisma.businessHour.findMany({
      where: {
        locationId,
      },

      orderBy: {
        dayOfWeek: 'asc',
      },
    });
  }

  async createBusinessClosure(
    locationId: string,
    dto: CreateBusinessClosureDto,
  ) {
    return this.prisma.businessClosure.create({
      data: {
        locationId,
        title: dto.title,
        startDateTime: new Date(
          dto.startDateTime,
        ),
        endDateTime: new Date(
          dto.endDateTime,
        ),
      },
    });
  }

  async findBusinessClosures(
    locationId: string,
  ) {
    return this.prisma.businessClosure.findMany({
      where: {
        locationId,
      },

      orderBy: {
        startDateTime: 'asc',
      },
    });
  }
}