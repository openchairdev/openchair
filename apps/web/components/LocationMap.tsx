'use client';

import Link from 'next/link';

export default function LocationMap() {
  return (
    <div className="relative h-[600px] overflow-hidden rounded-2xl border border-gray-300 bg-gray-100">
      <div className="absolute inset-0 flex items-center justify-center text-lg text-gray-400">
        Interactive Map
      </div>

      <Link
        href="/locations/amy-hair-salon"
        className="absolute left-[35%] top-[40%] rounded-full bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        📍 Amy Hair Salon
      </Link>

      <Link
        href="/locations/mike-barber-shop"
        className="absolute left-[55%] top-[30%] rounded-full bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        📍 Mike Barber Shop
      </Link>

      <Link
        href="/locations/seattle-beauty-studio"
        className="absolute left-[65%] top-[60%] rounded-full bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        📍 Seattle Beauty Studio
      </Link>
    </div>
  );
}