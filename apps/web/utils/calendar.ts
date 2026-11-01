import { CalendarBlockedRange } from '../types/calendar';

export function isBlocked(
  staffId: string,
  slotDateTime: Date,
  blockedRanges: CalendarBlockedRange[],
): boolean {
  return blockedRanges.some(range => {
    if (range.staffId !== staffId) {
      return false;
    }

    const start = new Date(range.startDateTime);

    const end = new Date(range.endDateTime);

    return (
      slotDateTime >= start &&
      slotDateTime < end
    );
  });
}