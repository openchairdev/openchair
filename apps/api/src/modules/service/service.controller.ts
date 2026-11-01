import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CreateServiceDto } from './dto/create-service.dto.js';
import { ServiceService } from './service.service.js';

@Controller()
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
  ) {}

  @Post('locations/:locationId/services')
  create(
    @Param('locationId') locationId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.serviceService.create(
      locationId,
      dto,
    );
  }

  @Get('locations/:locationId/services')
  findAll(
    @Param('locationId') locationId: string,
  ) {
    return this.serviceService.findAll(
      locationId,
    );
  }

  @Get('services/:id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.serviceService.findOne(id);
  }

  @Post('staff/:staffId/services/:serviceId')
  assignToStaff(
    @Param('staffId') staffId: string,

    @Param('serviceId') serviceId: string,
  ) {
    return this.serviceService.assignToStaff(
        staffId,
        serviceId,
    );
  }
  
  @Get('staff/:staffId/services')
  findByStaff(
    @Param('staffId') staffId: string,
  ) {
    return this.serviceService.findByStaff(
        staffId,
    );
  } 
  
  @Get('services/:serviceId/staff')
  findQualifiedStaff(
    @Param('serviceId') serviceId: string,
  ) {
    return this.serviceService.findQualifiedStaff(
        serviceId,
    );
  }  
}