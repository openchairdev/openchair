import {
  IsDateString,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class AppointmentRequestDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;
}