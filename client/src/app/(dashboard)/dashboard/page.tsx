'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/api-client';
import { DashboardStats } from '@/types';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Users, Car, CalendarCheck, DollarSign, ParkingCircle, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/reports/dashboard')
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="bg-blue-600" />
        <StatCard title="Registered Vehicles" value={stats?.totalVehicles ?? 0} icon={Car} color="bg-green-600" />
        <StatCard title="Total Bookings" value={stats?.totalBookings ?? 0} icon={CalendarCheck} color="bg-purple-600" />
        <StatCard title="Active Bookings" value={stats?.activeBookings ?? 0} icon={Activity} color="bg-orange-600" />
        <StatCard title="Occupancy Rate" value={`${stats?.occupancyRate ?? 0}%`} icon={ParkingCircle} color="bg-red-600" />
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} color="bg-emerald-600" />
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
    </div>
  );
}
