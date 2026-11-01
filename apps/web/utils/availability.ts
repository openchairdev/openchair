import { CalendarBlockedRange } from '../types/calendar';

export type AvailabilitySegment = {
  startMinute: number;
  endMinute: number;
  available: boolean;
};

export function buildAvailabilitySegments(
  staffId: string,
  date: Date,
  blockedRanges: CalendarBlockedRange[],
): AvailabilitySegment[] {
  const businessStart = 9 * 60;
  const businessEnd = 18 * 60;

  const dateString = date.toISOString().substring(0, 10);

  const staffBlocks = blockedRanges
    .filter(range => {
      return (
        range.staffId === staffId &&
        range.startDateTime.startsWith(dateString)
      );
    })
    .map(range => ({
      startMinute:
        new Date(range.startDateTime).getHours() * 60 +
        new Date(range.startDateTime).getMinutes(),

      endMinute:
        new Date(range.endDateTime).getHours() * 60 +
        new Date(range.endDateTime).getMinutes(),
    }))
    .sort((a, b) => a.startMinute - b.startMinute);

  const segments: AvailabilitySegment[] = [];

  let cursor = businessStart;

  staffBlocks.forEach(block => {
    if (block.startMinute > cursor) {
      segments.push({
        startMinute: cursor,
        endMinute: block.startMinute,
        available: true,
      });
    }

    segments.push({
      startMinute: block.startMinute,
      endMinute: block.endMinute,
      available: false,
    });

    cursor = block.endMinute;
  });

  if (cursor < businessEnd) {
    segments.push({
      startMinute: cursor,
      endMinute: businessEnd,
      available: true,
    });
  }

  return segments;
}