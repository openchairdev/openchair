import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStaffTimeOffDto {
  @IsDateString()
  startDateTime: string;

  @IsDateString()
  endDateTime: string;

  @IsOptional()
  @IsString()
  reason?: string;
}