import { Service } from '../types/service';

type ServicesViewProps = {
  services: Service[];
};

export default function ServicesView({
  services,
}: ServicesViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        Services
      </h1>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map(service => (
          <div
            key={service.id}
            className="rounded-2xl border border-gray-200 p-5"
          >
            <h2 className="text-xl font-semibold">
              {service.name}
            </h2>

            {service.description && (
              <p className="mt-3 text-gray-600">
                {service.description}
              </p>
            )}

            <div className="mt-4 flex justify-between text-sm text-gray-500">
              <span>
                {service.duration} Minutes
              </span>

              <span>
                ${service.price}
              </span>
            </div>

            <button className="mt-6 w-full rounded-xl bg-black px-4 py-2 text-white">
              Book This Service
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}