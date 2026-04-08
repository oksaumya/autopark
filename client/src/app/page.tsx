'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ParkingCircle, Car, Shield, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <ParkingCircle className="w-8 h-8 text-blue-400" />
          <span className="text-2xl font-bold text-white">AutoPark</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Register
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Smart Parking<br />
            <span className="text-blue-400">Management System</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Automate and optimize vehicle parking through real-time slot tracking,
            intelligent allocation, and digital monitoring.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/register" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
            <Link href="/login" className="px-8 py-3 border border-gray-600 text-gray-300 rounded-lg font-medium hover:border-gray-400 hover:text-white transition-colors">
              Login
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
            <Car className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Tracking</h3>
            <p className="text-gray-400">Monitor parking slot availability in real-time with live updates and visual floor maps.</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
            <Zap className="w-10 h-10 text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Smart Allocation</h3>
            <p className="text-gray-400">Intelligent algorithms to find the nearest, cheapest, or optimal parking spot for your vehicle.</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
            <Shield className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Secure Booking</h3>
            <p className="text-gray-400">Reserve slots in advance, track entry/exit, and manage payments digitally.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
