import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

const LOCATION_ID =
  'a730e156-607b-4e9d-88dc-7ef9fc6f9ffb';

const AMY_ID =
  '6173d0fb-c1fc-4544-8658-95fefbf7a7a9';

const MIKE_ID =
  '00000000-0000-4000-8000-000000000002';

const SARAH_ID =
  '00000000-0000-4000-8000-000000000003';

const CUSTOMER_ID =
  'd675fb27-1cda-417e-a7fd-1edef18afa04';

const SERVICE_ID =
  '79fe6c76-7d74-4082-846b-d8251d0faacc';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const staffSeed = [
  {
    id: AMY_ID,
    displayName: 'Amy',
    title: 'Senior Stylist',
  },
  {
    id: MIKE_ID,
    displayName: 'Mike',
    title: 'Barber',
  },
  {
    id: SARAH_ID,
    displayName: 'Sarah',
    title: 'Color Specialist',
  },
];

const businessHoursSeed = [
  {
    dayOfWeek: 0,
    openTime: '00:00',
    closeTime: '00:00',
    isClosed: true,
  },
  {
    dayOfWeek: 1,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: false,
  },
  {
    dayOfWeek: 2,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: false,
  },
  {
    dayOfWeek: 3,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: false,
  },
  {
    dayOfWeek: 4,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: false,
  },
  {
    dayOfWeek: 5,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: false,
  },
  {
    dayOfWeek: 6,
    openTime: '09:00',
    closeTime: '17:00',
    isClosed: false,
  },
];

const staffWeekdaySchedule = [
  {
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '18:00',
  },
  {
    dayOfWeek: 2,
    startTime: '09:00',
    endTime: '18:00',
  },
  {
    dayOfWeek: 3,
    startTime: '09:00',
    endTime: '18:00',
  },
  {
    dayOfWeek: 4,
    startTime: '09:00',
    endTime: '18:00',
  },
  {
    dayOfWeek: 5,
    startTime: '09:00',
    endTime: '18:00',
  },
];

const appointmentSeed = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    staffId: AMY_ID,
    appointmentStart:
      new Date('2027-03-08T10:00:00-08:00'),
    appointmentEnd:
      new Date('2027-03-08T10:30:00-08:00'),
    notes: '[SEED] March calendar test',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    staffId: MIKE_ID,
    appointmentStart:
      new Date('2027-03-09T11:00:00-08:00'),
    appointmentEnd:
      new Date('2027-03-09T12:00:00-08:00'),
    notes: '[SEED] March calendar test',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    staffId: SARAH_ID,
    appointmentStart:
      new Date('2027-03-10T13:00:00-08:00'),
    appointmentEnd:
      new Date('2027-03-10T14:30:00-08:00'),
    notes: '[SEED] March calendar test',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    staffId: AMY_ID,
    appointmentStart:
      new Date('2027-03-12T09:30:00-08:00'),
    appointmentEnd:
      new Date('2027-03-12T10:00:00-08:00'),
    notes: '[SEED] March calendar test',
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    staffId: MIKE_ID,
    appointmentStart:
      new Date('2027-03-22T14:00:00-07:00'),
    appointmentEnd:
      new Date('2027-03-22T15:30:00-07:00'),
    notes: '[SEED] March calendar test',
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    staffId: SARAH_ID,
    appointmentStart:
      new Date('2027-03-29T15:00:00-07:00'),
    appointmentEnd:
      new Date('2027-03-29T15:30:00-07:00'),
    notes: '[SEED] March calendar test',
  },
];

async function assertDependencies() {
  const [location, service, customer] =
    await Promise.all([
      prisma.location.findUnique({
        where: {
          id: LOCATION_ID,
        },
        select: {
          id: true,
          name: true,
        },
      }),

      prisma.service.findUnique({
        where: {
          id: SERVICE_ID,
        },
        select: {
          id: true,
          name: true,
        },
      }),

      prisma.user.findUnique({
        where: {
          id: CUSTOMER_ID,
        },
        select: {
          id: true,
        },
      }),
    ]);

  if (!location) {
    throw new Error(
      `Location not found: ${LOCATION_ID}`,
    );
  }

  if (!service) {
    throw new Error(
      `Service not found: ${SERVICE_ID}`,
    );
  }

  if (!customer) {
    throw new Error(
      `Customer not found: ${CUSTOMER_ID}`,
    );
  }

  console.log(
    `Seeding calendar data for ${location.name}`,
  );

  console.log(
    `Using service: ${service.name}`,
  );
}

async function seedStaff() {
  for (const staff of staffSeed) {
    await prisma.staff.upsert({
      where: {
        id: staff.id,
      },

      create: {
        id: staff.id,
        locationId: LOCATION_ID,
        displayName: staff.displayName,
        title: staff.title,
        isActive: true,
      },

      update: {
        locationId: LOCATION_ID,
        displayName: staff.displayName,
        title: staff.title,
        isActive: true,
      },
    });

    await prisma.staffService.upsert({
      where: {
        staffId_serviceId: {
          staffId: staff.id,
          serviceId: SERVICE_ID,
        },
      },

      create: {
        staffId: staff.id,
        serviceId: SERVICE_ID,
      },

      update: {},
    });
  }
}

async function seedBusinessHours() {
  for (const businessHour of businessHoursSeed) {
    await prisma.businessHour.upsert({
      where: {
        locationId_dayOfWeek: {
          locationId: LOCATION_ID,
          dayOfWeek: businessHour.dayOfWeek,
        },
      },

      create: {
        locationId: LOCATION_ID,
        ...businessHour,
      },

      update: {
        openTime: businessHour.openTime,
        closeTime: businessHour.closeTime,
        isClosed: businessHour.isClosed,
      },
    });
  }
}

async function seedStaffSchedules() {
  for (const staff of staffSeed) {
    for (const schedule of staffWeekdaySchedule) {
      await prisma.staffSchedule.upsert({
        where: {
          staffId_dayOfWeek: {
            staffId: staff.id,
            dayOfWeek: schedule.dayOfWeek,
          },
        },

        create: {
          staffId: staff.id,
          ...schedule,
        },

        update: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      });
    }
  }
}

async function seedTimeOff() {
  await prisma.staffTimeOff.upsert({
    where: {
      id: '20000000-0000-4000-8000-000000000001',
    },

    create: {
      id: '20000000-0000-4000-8000-000000000001',
      staffId: AMY_ID,
      startDateTime:
        new Date('2027-03-15T12:00:00-07:00'),
      endDateTime:
        new Date('2027-03-15T15:00:00-07:00'),
      reason: '[SEED] Personal appointment',
    },

    update: {
      staffId: AMY_ID,
      startDateTime:
        new Date('2027-03-15T12:00:00-07:00'),
      endDateTime:
        new Date('2027-03-15T15:00:00-07:00'),
      reason: '[SEED] Personal appointment',
    },
  });

  await prisma.staffTimeOff.upsert({
    where: {
      id: '20000000-0000-4000-8000-000000000002',
    },

    create: {
      id: '20000000-0000-4000-8000-000000000002',
      staffId: MIKE_ID,
      startDateTime:
        new Date('2027-03-23T09:00:00-07:00'),
      endDateTime:
        new Date('2027-03-23T13:00:00-07:00'),
      reason: '[SEED] Morning off',
    },

    update: {
      staffId: MIKE_ID,
      startDateTime:
        new Date('2027-03-23T09:00:00-07:00'),
      endDateTime:
        new Date('2027-03-23T13:00:00-07:00'),
      reason: '[SEED] Morning off',
    },
  });
}

async function seedClosures() {
  await prisma.businessClosure.upsert({
    where: {
      id: '30000000-0000-4000-8000-000000000001',
    },

    create: {
      id: '30000000-0000-4000-8000-000000000001',
      locationId: LOCATION_ID,
      title: '[SEED] Staff meeting',
      startDateTime:
        new Date('2027-03-18T13:00:00-07:00'),
      endDateTime:
        new Date('2027-03-18T16:00:00-07:00'),
    },

    update: {
      locationId: LOCATION_ID,
      title: '[SEED] Staff meeting',
      startDateTime:
        new Date('2027-03-18T13:00:00-07:00'),
      endDateTime:
        new Date('2027-03-18T16:00:00-07:00'),
    },
  });

  await prisma.businessClosure.upsert({
    where: {
      id: '30000000-0000-4000-8000-000000000002',
    },

    create: {
      id: '30000000-0000-4000-8000-000000000002',
      locationId: LOCATION_ID,
      title: '[SEED] Full-day closure',
      startDateTime:
        new Date('2027-03-25T00:00:00-07:00'),
      endDateTime:
        new Date('2027-03-26T00:00:00-07:00'),
    },

    update: {
      locationId: LOCATION_ID,
      title: '[SEED] Full-day closure',
      startDateTime:
        new Date('2027-03-25T00:00:00-07:00'),
      endDateTime:
        new Date('2027-03-26T00:00:00-07:00'),
    },
  });
}

async function seedAppointments() {
  for (const appointment of appointmentSeed) {
    await prisma.appointment.upsert({
      where: {
        id: appointment.id,
      },

      create: {
        id: appointment.id,
        locationId: LOCATION_ID,
        serviceId: SERVICE_ID,
        customerId: CUSTOMER_ID,
        staffId: appointment.staffId,
        appointmentStart:
          appointment.appointmentStart,
        appointmentEnd:
          appointment.appointmentEnd,
        status: 'CONFIRMED',
        notes: appointment.notes,
      },

      update: {
        locationId: LOCATION_ID,
        serviceId: SERVICE_ID,
        customerId: CUSTOMER_ID,
        staffId: appointment.staffId,
        appointmentStart:
          appointment.appointmentStart,
        appointmentEnd:
          appointment.appointmentEnd,
        status: 'CONFIRMED',
        notes: appointment.notes,
      },
    });
  }
}

async function main() {
  await assertDependencies();
  await seedStaff();
  await seedBusinessHours();
  await seedStaffSchedules();
  await seedTimeOff();
  await seedClosures();
  await seedAppointments();

  console.log(
    'March 2027 calendar seed completed.',
  );
}

main()
  .catch(error => {
    console.error(
      'Calendar seed failed:',
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
