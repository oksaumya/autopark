'use client';

import { useBookings } from '@/hooks/useBookings';
import { formatDateTime, formatCurrency, getBookingStatusColor, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { CalendarCheck, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookingsPage() {
  const { bookings, isLoading, refetch } = useBookings();
  const router = useRouter();

  const handleAction = async (id: string, action: 'cancel' | 'checkin' | 'checkout') => {
    try {
      const method = action === 'cancel' ? 'put' : 'post';
      await apiClient[method](`/bookings/${id}/${action}`);
      toast.success(`Booking ${action} successful`);
      
      if (action === 'checkout') {
        router.push(`/payment?bookingId=${id}`);
      } else {
        refetch();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || `Failed to ${action}`);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link href="/bookings/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          <Plus className="w-4 h-4" /> New Booking
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bookings yet</p>
          <Link href="/bookings/new" className="text-blue-600 hover:underline text-sm mt-2 block">Create your first booking</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">Slot {booking.slotNumber}</h3>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getBookingStatusColor(booking.status))}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Vehicle: {booking.vehicleLicensePlate} ({booking.vehicleType})</p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                  </p>
                  {booking.totalAmount && (
                    <p className="text-sm font-medium text-gray-700 mt-1">Amount: {formatCurrency(booking.totalAmount)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {booking.status === 'CONFIRMED' && (
                    <>
                      <button onClick={() => handleAction(booking.id, 'checkin')} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                        Check In
                      </button>
                      <button onClick={() => handleAction(booking.id, 'cancel')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 cursor-pointer">
                        Cancel
                      </button>
                    </>
                  )}
                  {booking.status === 'ACTIVE' && (
                    <button onClick={() => handleAction(booking.id, 'checkout')} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
