import { CalendarData } from '../types/calendar';
import VectorMonthlyCalendar from './VectorMonthlyCalendar';

type BookingViewProps = {
  calendar: CalendarData;
};

export default function BookingView({
  calendar,
}: BookingViewProps) {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold">
        Book Appointment
      </h1>

      <VectorMonthlyCalendar
        calendar={calendar}
      />
    </div>
  );
}
