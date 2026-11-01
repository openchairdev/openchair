import { CalendarData } from '../types/calendar';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000';

export async function getCalendar(
  locationId: string,
  year: number,
  month: number,
): Promise<CalendarData> {
  const response = await fetch(
    `${API_BASE_URL}/locations/${locationId}/calendar?year=${year}&month=${month}`,
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load calendar (${response.status})`,
    );
  }

  return response.json();
}