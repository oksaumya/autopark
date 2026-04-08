'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Vehicle } from '@/types';
import { getVehicleTypeIcon } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, Trash2, Car } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ licensePlate: '', type: 'CAR', make: '', model: '', color: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicles = () => {
    apiClient.get('/vehicles')
      .then((res) => setVehicles(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/vehicles', form);
      toast.success('Vehicle added!');
      setShowForm(false);
      setForm({ licensePlate: '', type: 'CAR', make: '', model: '', color: '' });
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/vehicles/${id}`);
      toast.success('Vehicle removed');
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to remove vehicle');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
              <input type="text" value={form.licensePlate} onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900">
                <option value="CAR">Car</option>
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="TRUCK">Truck</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input type="text" value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input type="text" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input type="text" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Adding...' : 'Add Vehicle'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </form>
      )}

      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No vehicles registered</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl mb-2">{getVehicleTypeIcon(v.type)}</div>
                  <h3 className="font-bold text-lg text-gray-900">{v.licensePlate}</h3>
                  <p className="text-sm text-gray-500">{v.type}</p>
                  {(v.make || v.model) && <p className="text-sm text-gray-500">{v.make} {v.model}</p>}
                  {v.color && <p className="text-sm text-gray-400">{v.color}</p>}
                  <p className="text-xs text-gray-400 mt-2">Compatible: {v.compatibleSlotTypes.join(', ')}</p>
                </div>
                <button onClick={() => handleDelete(v.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
