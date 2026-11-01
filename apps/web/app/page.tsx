import LocationMap from '../components/LocationMap';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-center text-5xl font-bold">
          OpenChair
        </h1>

        <p className="mt-4 text-center text-gray-600">
          Find your next appointment.
        </p>

        <div className="mx-auto mt-10 max-w-2xl">
          <input
            type="text"
            placeholder="Search salons, barbershops, stylists..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <LocationMap />
      </section>
    </main>
  );
}