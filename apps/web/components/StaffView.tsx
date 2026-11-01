import { Staff } from '../types/staff';

type StaffViewProps = {
  staffs: Staff[];
};

export default function StaffView({
  staffs,
}: StaffViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        Our Staff
      </h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {staffs.map(staff => (
          <div
            key={staff.id}
            className="rounded-2xl border border-gray-200 p-5"
          >
            <div className="mb-4 h-40 rounded-xl bg-gray-200" />

            <h2 className="text-xl font-semibold">
              {staff.displayName}
            </h2>

            {staff.title && (
              <p className="mt-2 text-gray-500">
                {staff.title}
              </p>
            )}

            {staff.bio && (
              <p className="mt-4 text-gray-600">
                {staff.bio}
              </p>
            )}

            <button className="mt-6 w-full rounded-xl bg-black px-4 py-2 text-white">
              View Availability
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}