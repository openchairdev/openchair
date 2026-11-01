import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { CalendarService } from './calendar.service.js';
import { GetLocationCalendarDto } from './dto/get-location-calendar.dto.js';

@Controller('locations')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
  ) {}

  @Get(':locationId/calendar')
  getLocationCalendar(
    @Param('locationId')
    locationId: string,

    @Query()
    query: GetLocationCalendarDto,
  ) {
    return this.calendarService.getLocationCalendar(
      locationId,
      query,
    );
  }
}