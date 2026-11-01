import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { AppointmentService } from './appointment.service.js';
import { ValidateAppointmentDto } from './dto/validate-appointment.dto.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  @Post('validate')
  validate(
    @Body()
    dto: ValidateAppointmentDto,
  ) {
    return this.appointmentService.validate(dto);
  }

  @Post('create')
  create(
    @Body()
    dto: CreateAppointmentDto,
  ) {
    return this.appointmentService.create(dto);
  }  
}