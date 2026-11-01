import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './infrastructure/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BusinessModule } from './modules/business/business.module.js';
import { ServiceModule } from './modules/service/service.module.js';
import { StaffModule } from './modules/staff/staff.module.js';
import { LocationModule } from './modules/location/location.module.js';
import { AppointmentModule } from './modules/appointment/appointment.module.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    AuthModule,

    BusinessModule,

    ServiceModule,

    StaffModule,

    LocationModule,

    AppointmentModule,

    CalendarModule,
  ],
})
export class AppModule {}