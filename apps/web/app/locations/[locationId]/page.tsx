'use client';

import { useEffect, useState } from 'react';

import Navbar from '../../../components/Navbar';
import HomeView from '../../../components/HomeView';
import ServicesView from '../../../components/ServicesView';
import StaffView from '../../../components/StaffView';
import ReviewsView from '../../../components/ReviewsView';
import BookingView from '../../../components/BookingView';
import ContactView from '../../../components/ContactView';

import { location } from '../../../mock/location';
import { services } from '../../../mock/services';
import { staffs } from '../../../mock/staffs';
import { reviews } from '../../../mock/reviews';

import { getCalendar } from '../../../services/calendar.service';
import { CalendarData } from '../../../types/calendar';

export default function LocationPage() {
  const [activeTab, setActiveTab] =
    useState('home');

  const [calendar, setCalendar] =
    useState<CalendarData | null>(null);

  const [isLoadingCalendar, setIsLoadingCalendar] =
    useState(true);

  useEffect(() => {
    async function loadCalendar() {
      try {
        const calendarData =
          await getCalendar(
            location.id,
            2027,
            3,
          );

        setCalendar(calendarData);
      } catch (error) {
        console.error(
          'Failed to load calendar',
          error,
        );
      } finally {
        setIsLoadingCalendar(false);
      }
    }

    loadCalendar();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'home' && (
        <HomeView location={location} />
      )}

      {activeTab === 'services' && (
        <ServicesView services={services} />
      )}

      {activeTab === 'staff' && (
        <StaffView staffs={staffs} />
      )}

      {activeTab === 'reviews' && (
        <ReviewsView reviews={reviews} />
      )}

      {activeTab === 'book' && (
        <>
          {isLoadingCalendar && (
            <div className="p-8">
              Loading calendar...
            </div>
          )}

          {!isLoadingCalendar &&
            calendar && (
              <BookingView
                calendar={calendar}
              />
            )}
        </>
      )}

      {activeTab === 'contact' && (
        <ContactView location={location} />
      )}
    </main>
  );
}