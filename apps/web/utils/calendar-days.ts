export function createMonthDays(
  year: number,
  month: number,
) {
  const days: Date[] = [];

  const count = new Date(
    year,
    month,
    0,
  ).getDate();

  for (
    let day = 1;
    day <= count;
    day++
  ) {
    days.push(
      new Date(year, month - 1, day),
    );
  }

  return days;
}