type Props = {
  year: number;
  month: number;
};

function getDays(
  year: number,
  month: number,
) {
  const daysInMonth = new Date(
    year,
    month,
    0,
  ).getDate();

  return Array.from(
    { length: daysInMonth },
    (_, index) => index + 1,
  );
}

export default function MonthlyCalendar({
  year,
  month,
}: Props) {
  const days = getDays(
    year,
    month,
  );

  return (
    <div className="overflow-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          March 2027
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {days.map(day => (
          <div
            key={day}
            className="
              min-h-[180px]
              rounded-xl
              border
              p-3
            "
          >
            <div className="font-bold">
              {day}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div>
                Amy
              </div>

              <div>
                Mike
              </div>

              <div>
                Sarah
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}