import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Type, Settings as SettingsIcon, Save, Check, Mail, MessageSquare } from 'lucide-react';

interface FontSetting {
  family: string;
  label: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'reminder' | 'task';
}

interface NotificationSettings {
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  emailTemplate: string;
  smsTemplate: string;
  lawyerSignature: string;
}

function SettingsPage() {
  // Get the current document font settings
  const getCurrentFontSettings = () => {
    // Get current font family (or default to Arial instead of Inter)
    const currentFontFamily = document.body.style.fontFamily || 'Arial';
    
    // Get current font size (or default to 16px)
    let currentFontSize = 16;
    const fontSizeStr = document.documentElement.style.fontSize;
    if (fontSizeStr) {
      // Extract numeric value from "16px" format
      const match = fontSizeStr.match(/(\d+)px/);
      if (match && match[1]) {
        currentFontSize = parseInt(match[1], 10);
      }
    }
    
    return { fontFamily: currentFontFamily, fontSize: currentFontSize };
  };
  
  // Get current settings
  const currentSettings = getCurrentFontSettings();
  
  // Font settings
  const [fontSize, setFontSize] = useState(currentSettings.fontSize);
  const [selectedFont, setSelectedFont] = useState(currentSettings.fontFamily);
  const [appliedFontSize, setAppliedFontSize] = useState(currentSettings.fontSize);
  const [appliedFont, setAppliedFont] = useState(currentSettings.fontFamily);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Client Meeting',
      date: '2024-03-15',
      type: 'meeting'
    },
    {
      id: '2',
      title: 'Document Review',
      date: '2024-03-16',
      type: 'task'
    }
  ]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    type: 'meeting' as const
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    emailTemplate: `Dear {clientName},

Welcome to our legal practice! We're delighted to have you as our client.

Your case will be handled by {lawyerName}. You can access your case information through our system using the following credentials:

Email: {clientEmail}
Case Reference: {caseReference}

If you have any questions, please don't hesitate to contact us at:
Phone: {lawyerPhone}
Email: {lawyerEmail}

Best regards,
{lawyerSignature}`,
    smsTemplate: `Welcome to {lawFirm}! Your lawyer {lawyerName} will handle your case. Access details sent to your email. Contact: {lawyerPhone}`,
    lawyerSignature: ''
  });

  const fonts: FontSetting[] = [
    { family: 'Arial', label: 'Arial (Default)' },
    { family: 'Times New Roman', label: 'Times New Roman' },
    { family: 'Georgia', label: 'Georgia' },
  ];

  const fontSizes = [
    { value: 14, label: 'Small' },
    { value: 16, label: 'Medium' },
    { value: 18, label: 'Large' },
    { value: 20, label: 'Extra Large' }
  ];

  // Load saved font settings on initial render
  useEffect(() => {
    const savedFontSettings = localStorage.getItem('fontSettings');
    if (savedFontSettings) {
      const parsed = JSON.parse(savedFontSettings);
      // Update only the selection UI states, not the applied values
      setFontSize(parsed.fontSize || currentSettings.fontSize);
      setSelectedFont(parsed.fontFamily || currentSettings.fontFamily);
    } else {
      // If no saved settings, apply Arial as default
      const defaultFont = 'Arial';
      if (currentSettings.fontFamily !== defaultFont) {
        setSelectedFont(defaultFont);
        setAppliedFont(defaultFont);
        // Save the default setting to localStorage
        localStorage.setItem('fontSettings', JSON.stringify({
          fontSize: currentSettings.fontSize,
          fontFamily: defaultFont
        }));
      }
    }
    
    const savedNotificationSettings = localStorage.getItem('notificationSettings');
    if (savedNotificationSettings) {
      setNotificationSettings(JSON.parse(savedNotificationSettings));
    }
  }, []);

  // Apply saved font settings to the document
  useEffect(() => {
    // We don't want to change document styles when this component mounts
    // Only apply styles when they are explicitly changed via save button
    document.documentElement.style.fontSize = `${appliedFontSize}px`;
    document.body.style.fontFamily = appliedFont;
  }, [appliedFontSize, appliedFont]);

  const handleSaveSettings = () => {
    // Apply the selected font settings
    setAppliedFontSize(fontSize);
    setAppliedFont(selectedFont);
    
    // Save settings to localStorage
    localStorage.setItem('fontSettings', JSON.stringify({
      fontSize,
      fontFamily: selectedFont
    }));

    // Show success message
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleSaveNotificationSettings = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    const event: CalendarEvent = {
      id: Date.now().toString(),
      ...newEvent
    };

    setEvents([...events, event]);
    setNewEvent({ title: '', date: '', type: 'meeting' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const dateString = currentDate.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.date === dateString);

      days.push(
        <div key={day} className="h-24 border border-gray-200 p-2">
          <div className="font-semibold mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate ${
                  event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                  event.type === 'task' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <SettingsIcon className="text-blue-600" />
          Settings
        </h1>
        <p className="text-gray-600">Customize your application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Font Settings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Type className="text-blue-600" />
            Font Settings
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {fonts.map((font) => (
                  <option
                    key={font.family}
                    value={font.family}
                    style={{ fontFamily: font.family }}
                  >
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <div className="space-y-2">
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {fontSizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label} ({size.value}px)
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Preview:</span>
                  <p style={{ fontSize: `${fontSize}px`, fontFamily: selectedFont }}>
                    Sample Text
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={20} />
                Save Font Settings
              </button>
            </div>

            {showSaveSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check size={20} />
                Settings saved successfully!
              </div>
            )}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <CalendarIcon className="text-blue-600" />
            Calendar
          </h2>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <h3 className="text-lg font-semibold">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold py-2 bg-gray-50">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>

          {/* Add Event Form */}
          <form onSubmit={handleAddEvent} className="space-y-4">
            <h3 className="font-semibold">Add New Event</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as 'meeting' | 'reminder' | 'task' })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="meeting">Meeting</option>
                <option value="reminder">Reminder</option>
                <option value="task">Task</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Event
            </button>
          </form>
        </div>
      </div>

      {/* New Notification Settings Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Mail className="text-blue-600" />
          Client Notification Settings
        </h2>

        <div className="space-y-6">
          {/* Enable/Disable Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Email Notifications</label>
                <p className="text-sm text-gray-500">Send welcome email to new clients</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  checked={notificationSettings.enableEmailNotifications}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    enableEmailNotifications: e.target.checked
                  })}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">SMS Notifications</label>
                <p className="text-sm text-gray-500">Send welcome SMS to new clients</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  checked={notificationSettings.enableSMSNotifications}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    enableSMSNotifications: e.target.checked
                  })}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
          </div>

          {/* Email Template */}
          <div>
            <label className="block font-medium mb-2">Email Template</label>
            <p className="text-sm text-gray-500 mb-2">
              Available variables: {'{clientName}'}, {'{lawyerName}'}, {'{clientEmail}'}, {'{caseReference}'}, {'{lawyerPhone}'}, {'{lawyerEmail}'}, {'{lawFirm}'}, {'{lawyerSignature}'}
            </p>
            <textarea
              value={notificationSettings.emailTemplate}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                emailTemplate: e.target.value
              })}
              className="w-full h-48 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* SMS Template */}
          <div>
            <label className="block font-medium mb-2">SMS Template</label>
            <p className="text-sm text-gray-500 mb-2">
              Keep it concise. Same variables available as email template.
            </p>
            <textarea
              value={notificationSettings.smsTemplate}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                smsTemplate: e.target.value
              })}
              className="w-full h-24 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Lawyer Signature */}
          <div>
            <label className="block font-medium mb-2">Lawyer Signature</label>
            <textarea
              value={notificationSettings.lawyerSignature}
              onChange={(e) => setNotificationSettings({
                ...notificationSettings,
                lawyerSignature: e.target.value
              })}
              placeholder="Enter your professional signature"
              className="w-full h-24 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveNotificationSettings}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={20} />
              Save Notification Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;