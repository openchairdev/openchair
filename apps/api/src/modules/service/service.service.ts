import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';

import { CreateServiceDto } from './dto/create-service.dto.js';

@Injectable()
export class ServiceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    locationId: string,
    dto: CreateServiceDto,
  ) {
    return this.prisma.service.create({
      data: {
        locationId,

        name: dto.name,

        description: dto.description,

        durationMinutes: dto.durationMinutes,

        price: dto.price,
      },
    });
  }

  async findAll(
    locationId: string,
  ) {
    return this.prisma.service.findMany({
      where: {
        locationId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(
    id: string,
  ) {
    return this.prisma.service.findUnique({
      where: {
        id,
      },
    });
  }

  async assignToStaff(
    staffId: string,
    serviceId: string,
  ) {
    return this.prisma.staffService.create({
      data: {
        staffId,
        serviceId,
      },
    });
  } 
  
  async findByStaff(
    staffId: string,
  ) {
    return this.prisma.staffService.findMany({
      where: {
        staffId,
      },
      include: {
        service: true,
      },
    });
  } 
  
  async findQualifiedStaff(
    serviceId: string,
  ) {
    return this.prisma.staffService.findMany({
      where: {
        serviceId,
      },
      include: {
        staff: true,
      },
    });
  }  
}