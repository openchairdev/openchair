import {
  IsDateString,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateBusinessClosureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  startDateTime: string;

  @IsDateString()
  endDateTime: string;
}