import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { AppointmentRequestDto }
  from './appointment-request.dto.js';

export class CreateAppointmentDto
  extends AppointmentRequestDto {

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}