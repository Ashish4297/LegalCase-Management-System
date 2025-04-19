import React, { useState } from 'react';
import { Bell, Check, X, Clock, AlertCircle } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
}

function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'New Case Assigned',
      message: 'You have been assigned to case #542344 - Will Smith',
      type: 'info',
      timestamp: '2 hours ago',
      isRead: false
    },
    {
      id: 2,
      title: 'Task Completed',
      message: 'Task "Find Evidence" has been marked as completed',
      type: 'success',
      timestamp: '3 hours ago',
      isRead: false
    },
    {
      id: 3,
      title: 'Upcoming Appointment',
      message: 'Reminder: Appointment with Will Smith tomorrow at 2:20 PM',
      type: 'warning',
      timestamp: '5 hours ago',
      isRead: true
    }
  ]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-100';
      case 'success':
        return 'bg-green-50 border-green-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-100';
      case 'error':
        return 'bg-red-50 border-red-100';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Notifications</h1>
          <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex-1 sm:flex-none bg-blue-50 px-3 py-1.5 rounded-lg"
            >
              Mark all as read
            </button>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800 transition-colors flex-1 sm:flex-none bg-red-50 px-3 py-1.5 rounded-lg"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 sm:space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No notifications to display</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 border rounded-lg transition-all hover:shadow-md ${
                  getNotificationColor(notification.type)
                } ${notification.isRead ? 'opacity-75' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  {/* Icon */}
                  <div className="flex items-center sm:items-start sm:pt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        {notification.title}
                        {!notification.isRead && (
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </h3>
                      <span className="text-xs text-gray-500 sm:ml-auto">
                        {notification.timestamp}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base break-words">
                      {notification.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end items-center gap-2 mt-2 sm:mt-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1.5 hover:bg-white rounded-full transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 hover:bg-white rounded-full transition-colors"
                      title="Delete notification"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationPage;