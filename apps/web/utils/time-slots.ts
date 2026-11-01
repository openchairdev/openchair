export function createTimeSlots() {
  const slots: string[] = [];

  for (let hour = 9; hour < 18; hour++) {
    for (const minute of [0, 15, 30, 45]) {
      slots.push(
        `${hour
          .toString()
          .padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`,
      );
    }
  }

  return slots;
}