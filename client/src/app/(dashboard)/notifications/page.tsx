'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Notification } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = () => {
    apiClient.get('/notifications')
      .then((res) => setNotifications(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: string) => {
    await apiClient.put(`/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await apiClient.put('/notifications/read-all');
    toast.success('All marked as read');
    fetchNotifications();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={cn(
                'bg-white rounded-lg border p-4 cursor-pointer transition-colors',
                n.isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50/50'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={cn('text-sm font-medium', n.isRead ? 'text-gray-700' : 'text-gray-900')}>{n.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
