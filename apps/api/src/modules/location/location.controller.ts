import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CreateBusinessClosureDto } from './dto/create-business-closure.dto.js';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto.js';
import { LocationService } from './location.service.js';

@Controller('locations')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
  ) {}

  @Post(':locationId/business-hours')
  createBusinessHour(
    @Param('locationId')
    locationId: string,

    @Body()
    dto: CreateBusinessHourDto,
  ) {
    return this.locationService.createBusinessHour(
      locationId,
      dto,
    );
  }

  @Get(':locationId/business-hours')
  findBusinessHours(
    @Param('locationId')
    locationId: string,
  ) {
    return this.locationService.findBusinessHours(
      locationId,
    );
  }

  @Post(':locationId/business-closures')
  createBusinessClosure(
    @Param('locationId')
    locationId: string,

    @Body()
    dto: CreateBusinessClosureDto,
  ) {
    return this.locationService.createBusinessClosure(
      locationId,
      dto,
    );
  }

  @Get(':locationId/business-closures')
  findBusinessClosures(
    @Param('locationId')
    locationId: string,
  ) {
    return this.locationService.findBusinessClosures(
      locationId,
    );
  }
}