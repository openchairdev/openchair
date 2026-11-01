import { CalendarData } from '../types/calendar';

type Props = {
  calendar: CalendarData;
};

const SLOT_MINUTES = 15;
const DAY_START_MINUTES = 9 * 60;
const DAY_END_MINUTES = 18 * 60;

function getDaysInMonth(
  year: number,
  month: number,
): number {
  return new Date(
    year,
    month,
    0,
  ).getDate();
}

function getFirstDayOfMonth(
  year: number,
  month: number,
): number {
  return new Date(
    year,
    month - 1,
    1,
  ).getDay();
}

function toMinutes(
  time: string,
): number {
  const [hour, minute] =
    time.split(':').map(Number);

  return hour * 60 + minute;
}

function createSlotMinutes(): number[] {
  const slots: number[] = [];

  for (
    let minute = DAY_START_MINUTES;
    minute < DAY_END_MINUTES;
    minute += SLOT_MINUTES
  ) {
    slots.push(minute);
  }

  return slots;
}

function createSlotDate(
  year: number,
  month: number,
  day: number,
  minuteOfDay: number,
): Date {
  const hour =
    Math.floor(minuteOfDay / 60);

  const minute =
    minuteOfDay % 60;

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  );
}

function isBlocked(
  calendar: CalendarData,
  staffId: string,
  slotStart: Date,
  slotEnd: Date,
): boolean {
  return calendar.blockedRanges.some(
    range => {
      if (range.staffId !== staffId) {
        return false;
      }

      const blockedStart =
        new Date(range.startDateTime);

      const blockedEnd =
        new Date(range.endDateTime);

      return (
        blockedStart < slotEnd &&
        blockedEnd > slotStart
      );
    },
  );
}

function isBusinessOpen(
  calendar: CalendarData,
  dayOfWeek: number,
  slotMinute: number,
): boolean {
  const businessHour =
    calendar.businessHours.find(
      item =>
        item.dayOfWeek === dayOfWeek,
    );

  if (
    !businessHour ||
    businessHour.isClosed
  ) {
    return false;
  }

  const openMinute =
    toMinutes(businessHour.openTime);

  const closeMinute =
    toMinutes(businessHour.closeTime);

  return (
    slotMinute >= openMinute &&
    slotMinute + SLOT_MINUTES <=
      closeMinute
  );
}

function isStaffScheduled(
  calendar: CalendarData,
  staffId: string,
  dayOfWeek: number,
  slotMinute: number,
): boolean {
  const schedule =
    calendar.staffSchedules.find(
      item =>
        item.staffId === staffId &&
        item.dayOfWeek === dayOfWeek,
    );

  if (!schedule) {
    return false;
  }

  const scheduleStart =
    toMinutes(schedule.startTime);

  const scheduleEnd =
    toMinutes(schedule.endTime);

  return (
    slotMinute >= scheduleStart &&
    slotMinute + SLOT_MINUTES <=
      scheduleEnd
  );
}

function isSlotAvailable(
  calendar: CalendarData,
  staffId: string,
  year: number,
  month: number,
  day: number,
  slotMinute: number,
): boolean {
  const slotStart =
    createSlotDate(
      year,
      month,
      day,
      slotMinute,
    );

  const slotEnd =
    new Date(
      slotStart.getTime() +
        SLOT_MINUTES * 60 * 1000,
    );

  const dayOfWeek =
    slotStart.getDay();

  if (
    !isBusinessOpen(
      calendar,
      dayOfWeek,
      slotMinute,
    )
  ) {
    return false;
  }

  if (
    !isStaffScheduled(
      calendar,
      staffId,
      dayOfWeek,
      slotMinute,
    )
  ) {
    return false;
  }

  if (
    isBlocked(
      calendar,
      staffId,
      slotStart,
      slotEnd,
    )
  ) {
    return false;
  }

  return true;
}

export default function MonthlyCalendarZoom1({
  calendar,
}: Props) {
  const daysInMonth =
    getDaysInMonth(
      calendar.year,
      calendar.month,
    );

  const firstDayOfMonth =
    getFirstDayOfMonth(
      calendar.year,
      calendar.month,
    );

  const numberOfCells =
    Math.ceil(
      (
        firstDayOfMonth +
        daysInMonth
      ) / 7,
    ) * 7;

  const cells = Array.from(
    {
      length: numberOfCells,
    },
    (_, index) => {
      const day =
        index -
        firstDayOfMonth +
        1;

      return day >= 1 &&
        day <= daysInMonth
        ? day
        : null;
    },
  );

  const slotMinutes =
    createSlotMinutes();

  const monthName =
    new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'long',
        year: 'numeric',
      },
    ).format(
      new Date(
        calendar.year,
        calendar.month - 1,
        1,
      ),
    );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="border-b bg-gray-50 p-4">
        <h2 className="text-xl font-bold">
          {monthName}
        </h2>
      </div>

      <div className="grid grid-cols-7 border-b bg-gray-100 text-center text-sm font-medium">
        <div className="border-r p-2">
          Sun
        </div>

        <div className="border-r p-2">
          Mon
        </div>

        <div className="border-r p-2">
          Tue
        </div>

        <div className="border-r p-2">
          Wed
        </div>

        <div className="border-r p-2">
          Thu
        </div>

        <div className="border-r p-2">
          Fri
        </div>

        <div className="p-2">
          Sat
        </div>
      </div>

      <div className="grid grid-cols-7">
        {cells.map(
          (day, cellIndex) => (
            <div
              key={cellIndex}
              className="min-h-[170px] border-r border-b p-1"
            >
              {day !== null && (
                <>
                  <div className="text-sm font-semibold">
                    {day}
                  </div>

                  {calendar.staffs.length ===
                  0 ? (
                    <div className="mt-3 text-center text-[10px] text-gray-400">
                      No staff
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns:
                            `18px repeat(${calendar.staffs.length}, minmax(0, 1fr))`,
                        }}
                      >
                        <div />

                        {calendar.staffs.map(
                          staff => (
                            <div
                              key={staff.id}
                              title={
                                staff.displayName
                              }
                              className="truncate px-[1px] text-center text-[9px] font-semibold"
                            >
                              {staff.displayName.substring(
                                0,
                                3,
                              )}
                            </div>
                          ),
                        )}
                      </div>

                      <div
                        className="mt-1 grid"
                        style={{
                          gridTemplateColumns:
                            `18px repeat(${calendar.staffs.length}, minmax(0, 1fr))`,
                        }}
                      >
                        <div className="relative h-[108px] text-[8px] text-gray-500">
                          <span className="absolute top-0">
                            09
                          </span>

                          <span className="absolute top-[24%]">
                            11
                          </span>

                          <span className="absolute top-[47%]">
                            13
                          </span>

                          <span className="absolute top-[70%]">
                            15
                          </span>

                          <span className="absolute top-[92%]">
                            17
                          </span>
                        </div>

                        {calendar.staffs.map(
                          staff => (
                            <div
                              key={`${day}-${staff.id}`}
                              className="flex h-[108px] flex-col px-[1px]"
                            >
                              {slotMinutes.map(
                                slotMinute => {
                                  const available =
                                    isSlotAvailable(
                                      calendar,
                                      staff.id,
                                      calendar.year,
                                      calendar.month,
                                      day,
                                      slotMinute,
                                    );

                                  return (
                                    <div
                                      key={
                                        slotMinute
                                      }
                                      title={
                                        available
                                          ? 'Available'
                                          : 'Unavailable'
                                      }
                                      className={
                                        available
                                          ? 'flex-1 bg-white'
                                          : 'flex-1 bg-gray-300'
                                      }
                                    />
                                  );
                                },
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}