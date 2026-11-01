import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CreateStaffScheduleDto } from './dto/create-staff-schedule.dto.js';
import { StaffService } from './staff.service.js';

import { CreateStaffTimeOffDto } from './dto/create-staff-time-off.dto.js';

@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
  ) {}

  @Post(':staffId/schedules')
  createSchedule(
    @Param('staffId') staffId: string,

    @Body()
    dto: CreateStaffScheduleDto,
  ) {
    return this.staffService.createSchedule(
      staffId,
      dto,
    );
  }

  @Get(':staffId/schedules')
  findSchedules(
    @Param('staffId') staffId: string,
  ) {
    return this.staffService.findSchedules(
      staffId,
    );
  }

  @Post(':staffId/time-off')
  createTimeOff(
    @Param('staffId') staffId: string,

    @Body()
    dto: CreateStaffTimeOffDto,
  ) {
    return this.staffService.createTimeOff(
      staffId,
      dto,
    );
  } 
  
  @Get(':staffId/time-off')
  findTimeOff(
    @Param('staffId') staffId: string,
  ) {
    return this.staffService.findTimeOff(
      staffId,
    );
  }    
}