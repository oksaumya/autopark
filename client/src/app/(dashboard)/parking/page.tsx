'use client';

import { useState } from 'react';
import { useParkingSlots, useParkingFloors } from '@/hooks/useParkingSlots';
import { getSlotStatusColor, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ParkingSlot } from '@/types';

export default function ParkingPage() {
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const { slots, isLoading, refetch } = useParkingSlots({
    floorId: selectedFloor || undefined,
    type: selectedType || undefined,
  });
  const { floors } = useParkingFloors();
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  if (isLoading) return <LoadingSpinner />;

  const statusCounts = {
    AVAILABLE: slots.filter((s) => s.status === 'AVAILABLE').length,
    OCCUPIED: slots.filter((s) => s.status === 'OCCUPIED').length,
    RESERVED: slots.filter((s) => s.status === 'RESERVED').length,
    MAINTENANCE: slots.filter((s) => s.status === 'MAINTENANCE').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parking Map</h1>
        <button onClick={refetch} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Refresh
        </button>
      </div>

      {/* Status Legend */}
      <div className="flex gap-4 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', getSlotStatusColor(status))} />
            <span className="text-sm text-gray-600">{status}: {count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
        >
          <option value="">All Floors</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
        >
          <option value="">All Types</option>
          <option value="COMPACT">Compact</option>
          <option value="REGULAR">Regular</option>
          <option value="LARGE">Large</option>
          <option value="HANDICAPPED">Handicapped</option>
          <option value="ELECTRIC_CHARGING">Electric Charging</option>
        </select>
      </div>

      {/* Slot Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {slots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => setSelectedSlot(slot)}
            className={cn(
              'p-4 rounded-xl border-2 transition-all text-left',
              slot.status === 'AVAILABLE' ? 'border-green-300 bg-green-50 hover:border-green-500' :
              slot.status === 'OCCUPIED' ? 'border-red-300 bg-red-50' :
              slot.status === 'RESERVED' ? 'border-yellow-300 bg-yellow-50' :
              'border-gray-300 bg-gray-50',
              selectedSlot?.id === slot.id && 'ring-2 ring-blue-500'
            )}
          >
            <p className="font-bold text-gray-900">{slot.slotNumber}</p>
            <p className="text-xs text-gray-500 mt-1">{slot.type.replace('_', ' ')}</p>
            <div className={cn('w-2 h-2 rounded-full mt-2', getSlotStatusColor(slot.status))} />
            <p className="text-xs text-gray-400 mt-1">${slot.pricePerHour}/hr</p>
          </button>
        ))}
      </div>

      {/* Slot Detail Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedSlot(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Slot {selectedSlot.slotNumber}</h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-medium">{selectedSlot.type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status:</span><span className={cn('px-2 py-1 rounded text-xs font-medium', getSlotStatusColor(selectedSlot.status), 'text-white')}>{selectedSlot.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Floor:</span><span className="font-medium">{selectedSlot.floorName ?? 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Price:</span><span className="font-medium">${selectedSlot.pricePerHour}/hr</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Distance:</span><span className="font-medium">{selectedSlot.distanceFromEntry}m from entry</span></div>
            </div>
            {selectedSlot.status === 'AVAILABLE' && (
              <a href={`/bookings/new?slotId=${selectedSlot.id}`} className="block text-center mt-6 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Book This Slot
              </a>
            )}
            <button onClick={() => setSelectedSlot(null)} className="w-full mt-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
