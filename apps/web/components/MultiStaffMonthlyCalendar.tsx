import { CalendarData } from '../types/calendar';

type Props = {
  calendar: CalendarData;
};

const times = [
  '09:00',
  '09:15',
  '09:30',
  '09:45',
  '10:00',
  '10:15',
  '10:30',
];

const weekDays = [
  {
    day: 'Mon',
    date: 15,
  },
  {
    day: 'Tue',
    date: 16,
  },
  {
    day: 'Wed',
    date: 17,
  },
  {
    day: 'Thu',
    date: 18,
  },
  {
    day: 'Fri',
    date: 19,
  },
  {
    day: 'Sat',
    date: 20,
  },
  {
    day: 'Sun',
    date: 21,
  },
];

export default function MultiStaffMonthlyCalendar({
  calendar,
}: Props) {
  const staffCount = calendar.staffs.length;

  return (
    <div className="overflow-auto rounded-xl border">
      <div className="border-b bg-gray-50 p-4">
        <h2 className="text-2xl font-bold">
          March 2027
        </h2>
      </div>

      {/* Day Header */}
      <div
        className="grid border-b bg-gray-100"
        style={{
          gridTemplateColumns: `100px repeat(${weekDays.length}, minmax(${staffCount * 80}px, 1fr))`,
        }}
      >
        <div className="border-r p-3" />

        {weekDays.map(day => (
          <div
            key={day.date}
            className="border-r p-3 text-center"
          >
            <div className="font-semibold">
              {day.day}
            </div>

            <div className="text-sm text-gray-500">
              Mar {day.date}
            </div>
          </div>
        ))}
      </div>

      {/* Staff Header */}
      <div
        className="grid border-b bg-gray-50"
        style={{
          gridTemplateColumns: `100px repeat(${weekDays.length}, minmax(${staffCount * 80}px, 1fr))`,
        }}
      >
        <div className="border-r p-3 font-semibold">
          Time
        </div>

        {weekDays.map(day => (
          <div
            key={day.date}
            className="grid border-r"
            style={{
              gridTemplateColumns: `repeat(${staffCount}, 1fr)`,
            }}
          >
            {calendar.staffs.map(staff => (
              <div
                key={`${day.date}-${staff.id}`}
                className="border-r p-2 text-center text-sm font-medium"
              >
                {staff.displayName}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Time Rows */}
      {times.map(time => (
        <div
          key={time}
          className="grid"
          style={{
            gridTemplateColumns: `100px repeat(${weekDays.length}, minmax(${staffCount * 80}px, 1fr))`,
          }}
        >
          <div className="border-r border-b p-3 text-sm">
            {time}
          </div>

          {weekDays.map(day => (
            <div
              key={`${time}-${day.date}`}
              className="grid border-r"
              style={{
                gridTemplateColumns: `repeat(${staffCount}, 1fr)`,
              }}
            >
              {calendar.staffs.map(staff => (
                <button
                  key={`${day.date}-${staff.id}-${time}`}
                  className="
                    h-12
                    border-r
                    border-b
                    bg-white
                    hover:bg-gray-100
                  "
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}