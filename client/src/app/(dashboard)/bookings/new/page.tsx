'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Vehicle } from '@/types';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedSlotId = searchParams.get('slotId');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '',
    slotId: preSelectedSlotId || '',
    startTime: '',
    endTime: '',
    strategy: 'nearest',
  });

  useEffect(() => {
    apiClient.get('/vehicles')
      .then((res) => setVehicles(res.data.data))
      .catch(() => toast.error('Failed to load vehicles'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (end <= start) {
      toast.error('End time must be after start time');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        vehicleId: form.vehicleId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        strategy: form.strategy,
      };
      if (form.slotId) payload.slotId = form.slotId;

      await apiClient.post('/bookings', payload);
      toast.success('Booking created successfully!');
      router.push('/bookings');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Booking</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
          <select
            value={form.vehicleId}
            onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900"
            required
          >
            <option value="">Select a vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.licensePlate} - {v.type} {v.make} {v.model}</option>
            ))}
          </select>
          {vehicles.length === 0 && (
            <p className="text-xs text-red-500 mt-1">No vehicles registered. <a href="/vehicles" className="underline">Add one first</a>.</p>
          )}
        </div>

        {!preSelectedSlotId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Strategy</label>
            <select
              value={form.strategy}
              onChange={(e) => setForm((f) => ({ ...f, strategy: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="nearest">Nearest to Entry</option>
              <option value="cheapest">Cheapest Price</option>
              <option value="priority">Priority (Distance + Floor)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">System will auto-allocate the best slot based on your vehicle type and strategy.</p>
          </div>
        )}

        {preSelectedSlotId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot ID</label>
            <input
              type="text"
              value={form.slotId}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !form.vehicleId}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
}
