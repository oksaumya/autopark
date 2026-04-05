'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Vehicle } from '@/types';
import { formatDateTime, getBookingStatusColor, cn } from '@/lib/utils';
import { useBookings } from '@/hooks/useBookings';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { Users, Car, CalendarCheck, DollarSign, ParkingCircle, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { bookings, isLoading: bookingsLoading } = useBookings();

  useEffect(() => {
    apiClient.get('/vehicles')
      .then((res) => setVehicles(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const activeBookings = bookings.filter((booking) => ['CONFIRMED', 'ACTIVE'].includes(booking.status));
  const currentBookings = activeBookings.slice(0, 3);

  if (isLoading || bookingsLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Registered Vehicles" value={vehicles.length} icon={Car} color="bg-green-600" />
        <StatCard title="Total Bookings" value={bookings.length} icon={CalendarCheck} color="bg-purple-600" />
        <StatCard title="Active Bookings" value={activeBookings.length} icon={Activity} color="bg-orange-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/bookings/new" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <CalendarCheck className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Book a Slot</p>
            <p className="text-sm text-gray-500">Reserve a parking spot</p>
          </a>
          <a href="/parking" className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <ParkingCircle className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">View Parking Map</p>
            <p className="text-sm text-gray-500">Real-time slot availability</p>
          </a>
          <a href="/vehicles" className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Car className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">My Vehicles</p>
            <p className="text-sm text-gray-500">Manage registered vehicles</p>
          </a>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Bookings</h2>
          <Link href="/bookings" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>

        {bookingsLoading ? (
          <LoadingSpinner />
        ) : currentBookings.length === 0 ? (
          <p className="text-sm text-gray-500">You have no active bookings.</p>
        ) : (
          <div className="space-y-3">
            {currentBookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">Slot {booking.slotNumber}</p>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getBookingStatusColor(booking.status))}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Vehicle: {booking.vehicleLicensePlate} ({booking.vehicleType})</p>
                    <p className="text-sm text-gray-600">{formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}</p>
                  </div>
                  <Link href="/bookings" className="text-xs text-blue-600 hover:underline">Manage</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
