import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { BusinessService } from './business.service.js';
import { CreateBusinessDto } from './dto/create-business.dto.js';

@Controller('business/onboarding')
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
  ) {}

  @Post('create')
  create(
    @Body() dto: CreateBusinessDto,
  ) {
    return this.businessService.create(dto);
  }
}