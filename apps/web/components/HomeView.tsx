import { Location } from '../types/location';

type HomeViewProps = {
  location: Location;
};

export default function HomeView({
  location,
}: HomeViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="overflow-hidden rounded-3xl border border-gray-200">
        <div className="h-72 bg-gray-200" />

        <div className="p-8">
          <h1 className="text-5xl font-bold">
            {location.name}
          </h1>

          <p className="mt-4 text-xl text-gray-600">
            {location.tagline}
          </p>

          <div className="mt-6 flex flex-wrap gap-6 text-gray-500">
            <span>
              ★ {location.rating}
            </span>

            <span>
              {location.reviewCount} Reviews
            </span>

            <span>
              {location.city}, {location.state}
            </span>
          </div>

          <button className="mt-8 rounded-xl bg-black px-6 py-3 text-white">
            Book Appointment
          </button>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold">
          About
        </h2>

        <p className="mt-4 text-gray-600">
          {location.description}
        </p>
      </div>
    </div>
  );
}