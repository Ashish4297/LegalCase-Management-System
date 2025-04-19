import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  GavelIcon,
  Calendar,
  ClipboardList,
  Users2,
  DollarSign,
  FileText,
  Bot,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  UserCircle
} from 'lucide-react';
import { logout, getCurrentUser } from '../utils/auth';
import NotificationDropdown from './NotificationDropdown';

interface SidebarLink {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: string[];
}

function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const sidebarLinks: SidebarLink[] = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['lawyer'] },
    { to: '/clients', icon: <Users size={20} />, label: 'Clients', roles: ['lawyer'] },
    { to: '/cases', icon: <GavelIcon size={20} />, label: 'Cases', roles: ['lawyer', 'client'] },
    { to: '/appointments', icon: <Calendar size={20} />, label: 'Appointments', roles: ['lawyer'] },
    { to: '/tasks', icon: <ClipboardList size={20} />, label: 'Tasks', roles: ['lawyer'] },
    { to: '/team', icon: <Users2 size={20} />, label: 'Team Members', roles: ['lawyer'] },
    { 
      to: '/earnings/services', 
      icon: <DollarSign size={20} />, 
      label: 'Services', 
      roles: ['lawyer', 'client'] 
    },
    { to: '/earnings/invoices', icon: <FileText size={20} />, label: 'Invoices', roles: ['lawyer'] },
    { 
      to: '/chatbot', 
      icon: <Bot size={20} />, 
      label: 'Legal Assistant', 
      roles: ['lawyer', 'client'] 
    },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings', roles: ['lawyer'] }
  ];

  const filteredLinks = sidebarLinks.filter(link => 
    link.roles.includes(currentUser?.role || '')
  );

  const isLegalAssistantPage = location.pathname === '/chatbot';

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notifications');
      // Ensure response.data is an array before using filter
      const notificationsData = Array.isArray(response.data) ? response.data : 
                               (response.data?.notifications || []);
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter((n: any) => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('http://localhost:5000/api/notifications/read-all');
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-white border-r">
          <div className="flex items-center justify-between mb-6 px-2">
            <Link to="/" className="flex items-center space-x-3">
              <GavelIcon className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-semibold">LegalCase MS</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <ul className="space-y-2">
            {filteredLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-100 ${
                    location.pathname === link.to ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  {link.icon}
                  <span className="ml-3">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <Menu size={24} />
              </button>
              <div className="ml-4">
                <span className="text-sm text-gray-500">Welcome,</span>
                <span className="ml-1 font-medium">{currentUser?.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative inline-block">
                <button
                  onClick={() => {
                    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 relative p-1.5 rounded-full hover:bg-gray-100 focus:outline-none flex items-center justify-center"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationDropdownOpen && (
                  <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                  />
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 focus:outline-none flex items-center justify-center"
                  aria-label="User profile"
                >
                  <UserCircle size={24} />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 origin-top-right">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium">{currentUser?.name}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto">{children}</main>
        
        {/* Floating Legal Assistant Button */}
        {!isLegalAssistantPage && (
          <button
            onClick={() => navigate('/chatbot')}
            className="fixed bottom-12 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50 flex items-center justify-center transition-all duration-300 hover:scale-105"
            aria-label="Chat with Legal Assistant"
          >
            <Bot size={24} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Layout;