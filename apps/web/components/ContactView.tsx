import { Location } from '../types/location';

type ContactViewProps = {
  location: Location;
};

export default function ContactView({
  location,
}: ContactViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        Contact
      </h1>

      <div className="mt-8 rounded-2xl border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900">
              Business Name
            </h2>

            <p className="mt-2 text-gray-600">
              {location.name}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Phone
            </h2>

            <p className="mt-2 text-gray-600">
              {location.phone}
            </p>
          </div>

          {location.email && (
            <div>
              <h2 className="font-semibold text-gray-900">
                Email
              </h2>

              <p className="mt-2 text-gray-600">
                {location.email}
              </p>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-gray-900">
              Address
            </h2>

            <p className="mt-2 text-gray-600">
              {location.address}
            </p>

            <p className="text-gray-600">
              {location.city}, {location.state}{' '}
              {location.postalCode}
            </p>
          </div>

          {location.website && (
            <div>
              <h2 className="font-semibold text-gray-900">
                Website
              </h2>

              <p className="mt-2 text-gray-600">
                {location.website}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}