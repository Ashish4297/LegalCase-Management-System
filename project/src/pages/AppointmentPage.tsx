import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, MoreVertical, Search } from 'lucide-react';
import { useAppointments, Appointment, AppointmentInput } from '../hooks/useAppointments';
import { useClients } from '../hooks/useClients';
import { format } from 'date-fns';

function AppointmentPage() {
  const { appointments, loading, error, fetchAppointments, addAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus } = useAppointments();
  const { clients, loading: clientsLoading, fetchClients } = useClients();
  
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<AppointmentInput>({
    title: '',
    clientId: '',
    dateTime: '',
    duration: 60,
    location: '',
    description: '',
    status: 'Scheduled'
  });

  // Add a state to track if clients have been successfully loaded
  const [clientsSuccessfullyLoaded, setClientsSuccessfullyLoaded] = useState(false);

  // Ensure clients are loaded - with retry mechanism
  useEffect(() => {
    console.log('AppointmentPage mounted, forcing client refresh');
    
    // Function to load clients with retries
    const loadClients = async (retryCount = 0) => {
      try {
        await fetchClients();
        console.log('Client fetch complete, clients length:', clients.length);
        
        // If clients array is empty but we didn't get an error, retry a few times
        if (clients.length === 0 && retryCount < 3) {
          console.log(`No clients found, retrying (${retryCount + 1}/3)...`);
          setTimeout(() => loadClients(retryCount + 1), 1000); // Wait 1 second before retry
        } else if (clients.length > 0) {
          // Mark clients as successfully loaded
          setClientsSuccessfullyLoaded(true);
          
          // Cache client data in localStorage for resilience
          localStorage.setItem('cachedClients', JSON.stringify(clients));
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        
        // Retry on error
        if (retryCount < 3) {
          console.log(`Error fetching clients, retrying (${retryCount + 1}/3)...`);
          setTimeout(() => loadClients(retryCount + 1), 1500); // Wait 1.5 seconds before retry
        }
      }
    };
    
    // Start loading clients
    loadClients();
  }, [fetchClients]); // Only run on mount
  
  // Load cached clients from localStorage if available
  useEffect(() => {
    if (clients.length === 0 && !clientsLoading) {
      const cachedClientsJson = localStorage.getItem('cachedClients');
      if (cachedClientsJson) {
        try {
          const cachedClients = JSON.parse(cachedClientsJson);
          if (Array.isArray(cachedClients) && cachedClients.length > 0) {
            console.log('Using cached clients data:', cachedClients.length);
            // We can't directly set clients (it's from a hook), but we can use it in our component
            setClientsSuccessfullyLoaded(true);
          }
        } catch (e) {
          console.error('Error parsing cached clients:', e);
        }
      }
    }
  }, [clients.length, clientsLoading]);

  // Monitor when clients load
  useEffect(() => {
    console.log(`Clients updated: ${clients.length} clients available`);
    if (clients.length > 0) {
      console.log('Sample client IDs:', clients.slice(0, 3).map(c => c._id));
      setClientsSuccessfullyLoaded(true);
      localStorage.setItem('cachedClients', JSON.stringify(clients));
    }
  }, [clients]);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        // Edit existing appointment
        await updateAppointment(editingAppointment._id, formData);
      } else {
        // Add new appointment
        await addAppointment(formData);
      }
      setShowModal(false);
      setFormData({
        title: '',
        clientId: '',
        dateTime: '',
        duration: 60,
        location: '',
        description: '',
        status: 'Scheduled'
      });
      setEditingAppointment(null);
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Failed to save appointment. Please check your form and try again.');
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      title: appointment.title,
      clientId: appointment.clientId,
      dateTime: appointment.dateTime,
      duration: appointment.duration,
      location: appointment.location || '',
      description: appointment.description || '',
      status: appointment.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointment(id);
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment.');
      }
    }
  };

  const handleSearch = () => {
    // The API doesn't support filtering by date range directly,
    // so we'll filter the fetched appointments client-side
    fetchAppointments();
  };

  const handleClear = () => {
    setDateRange({ from: '', to: '' });
    fetchAppointments();
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter appointments based on search term and date range
  const filteredAppointments = appointments.filter(appointment => {
    // Search term filter
    const clientInfo = clients.find(c => c._id === appointment.clientId);
    const searchMatch = 
      appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientInfo?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientInfo?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date range filter
    const appointmentDate = new Date(appointment.dateTime);
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;
    
    let dateMatch = true;
    if (fromDate && toDate) {
      dateMatch = appointmentDate >= fromDate && appointmentDate <= toDate;
    } else if (fromDate) {
      dateMatch = appointmentDate >= fromDate;
    } else if (toDate) {
      dateMatch = appointmentDate <= toDate;
    }
    
    return searchMatch && dateMatch;
  });

  // Helper function to format date and time
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: format(date, 'MM/dd/yyyy'),
      time: format(date, 'h:mm a')
    };
  };

  // Get client name from clientId with fallback to cached data
  const getClientName = (clientId: string | any) => {
    // Handle case where clientId is an object instead of a string
    let clientIdStr = '';
    
    if (clientId === null || clientId === undefined) {
      return 'No Client Assigned';
    }
    
    // Handle case where clientId is an object (e.g. {_id: "123"})
    if (typeof clientId === 'object') {
      console.log('ClientId is an object:', clientId);
      // Try to extract _id property if it exists
      if (clientId._id) {
        clientIdStr = String(clientId._id);
        console.log('Extracted ID from object:', clientIdStr);
      } else if (clientId.id) {
        clientIdStr = String(clientId.id);
        console.log('Extracted ID from object:', clientIdStr);
      } else {
        console.error('Cannot extract ID from clientId object:', clientId);
        return 'Invalid Client ID';
      }
    } else {
      // Normal case: clientId is a string or number
      clientIdStr = String(clientId);
    }
    
    // Debug logging
    console.log(`Looking for client with ID (normalized): ${clientIdStr}`);
    
    // Check if client ID is valid
    if (!clientIdStr) return 'No Client Assigned';
    
    // First try from the current clients state
    if (clients.length > 0) {
      // Find the client by ID - exact match first
      const client = clients.find(c => String(c._id) === clientIdStr);
      
      // If client is found with exact match, return name
      if (client && client.name) {
        console.log(`Found client in state: ${client.name}`);
        return client.name;
      }
      
      // If no exact match, try alternative matching approaches
      for (const c of clients) {
        // Convert both to strings to ensure proper comparison
        const cId = String(c._id || '');
        
        // Try to match by substring
        if ((cId.includes(clientIdStr) && clientIdStr.length > 5) || 
            (clientIdStr.includes(cId) && cId.length > 5)) {
          console.log(`Found client by partial ID match: ${c.name}`);
          return c.name;
        }
      }
    }
    
    // Continue with existing cache logic using clientIdStr
    // ... rest of function remains the same with clientIdStr
    
    // If not found in current state, try cached data
    const cachedClientsJson = localStorage.getItem('cachedClients');
    if (cachedClientsJson) {
      try {
        const cachedClients = JSON.parse(cachedClientsJson);
        if (Array.isArray(cachedClients)) {
          // Try exact match
          const cachedClient = cachedClients.find(c => String(c._id) === clientIdStr);
          if (cachedClient && cachedClient.name) {
            console.log(`Found client in cache: ${cachedClient.name}`);
            return cachedClient.name;
          }
          
          // Try partial match
          for (const c of cachedClients) {
            const cId = String(c._id || '');
            
            if ((cId.includes(clientIdStr) && clientIdStr.length > 5) || 
                (clientIdStr.includes(cId) && cId.length > 5)) {
              console.log(`Found client in cache by partial match: ${c.name}`);
              return c.name;
            }
          }
        }
      } catch (e) {
        console.error('Error parsing cached clients:', e);
      }
    }
    
    // Final fallback - check appointment title for client name
    const appointment = appointments.find(a => {
      // Handle case where appointment.clientId could also be an object
      if (typeof a.clientId === 'object' && a.clientId !== null) {
        // Type assertion to avoid TypeScript error
        const clientIdObj = a.clientId as { _id?: string; id?: string };
        return clientIdObj._id ? String(clientIdObj._id) === clientIdStr : false;
      }
      return String(a.clientId) === clientIdStr;
    });
    
    if (appointment && appointment.title && appointment.title.includes('with')) {
      // Try to extract client name from title
      const titleParts = appointment.title.split('with');
      if (titleParts.length > 1) {
        const extractedName = titleParts[1].trim();
        console.log(`Extracted client name from title: ${extractedName}`);
        return extractedName;
      }
    }
    
    return clientsLoading ? 'Loading...' : 'Client Not Found';
  };

  // Similar cache-aware approach for getClientPhone with object handling
  const getClientPhone = (clientId: string | any) => {
    // Handle case where clientId is an object instead of a string
    let clientIdStr = '';
    
    if (clientId === null || clientId === undefined) {
      return 'No Contact Info';
    }
    
    // Handle case where clientId is an object (e.g. {_id: "123"})
    if (typeof clientId === 'object') {
      console.log('ClientId is an object:', clientId);
      // Try to extract _id property if it exists
      if (clientId._id) {
        clientIdStr = String(clientId._id);
      } else if (clientId.id) {
        clientIdStr = String(clientId.id);
      } else {
        console.error('Cannot extract ID from clientId object:', clientId);
        return 'Invalid Client ID';
      }
    } else {
      // Normal case: clientId is a string or number
      clientIdStr = String(clientId);
    }
    
    // Check if client ID is valid
    if (!clientIdStr) return 'No Contact Info';
    
    // First try from current clients state
    if (clients.length > 0) {
      // Find the client by ID
      const client = clients.find(c => String(c._id) === clientIdStr);
      
      // If client is found, return phone or mobile number
      if (client) {
        return client.phone || client.mobile || 'No phone number';
      }
      
      // Try partial matching
      for (const c of clients) {
        const cId = String(c._id || '');
        
        if ((cId.includes(clientIdStr) && clientIdStr.length > 5) || 
            (clientIdStr.includes(cId) && cId.length > 5)) {
          return c.phone || c.mobile || 'No phone number';
        }
      }
    }
    
    // Try cached data if not found in state
    const cachedClientsJson = localStorage.getItem('cachedClients');
    if (cachedClientsJson) {
      try {
        const cachedClients = JSON.parse(cachedClientsJson);
        if (Array.isArray(cachedClients)) {
          // Try exact match
          const cachedClient = cachedClients.find(c => String(c._id) === clientIdStr);
          if (cachedClient) {
            return cachedClient.phone || cachedClient.mobile || 'No phone number';
          }
          
          // Try partial match
          for (const c of cachedClients) {
            const cId = String(c._id || '');
            
            if ((cId.includes(clientIdStr) && clientIdStr.length > 5) || 
                (clientIdStr.includes(cId) && cId.length > 5)) {
              return c.phone || c.mobile || 'No phone number';
            }
          }
        }
      } catch (e) {
        console.error('Error parsing cached clients:', e);
      }
    }
    
    return clientsLoading ? 'Loading...' : 'No Contact Info';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Appointment</h1>
        <button
          onClick={() => {
            setEditingAppointment(null);
            setFormData({
              title: '',
              clientId: '',
              dateTime: '',
              duration: 60,
              location: '',
              description: '',
              status: 'Scheduled'
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Appointment
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date:
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date:
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 flex items-center"
            >
              <Search size={18} className="mr-1" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="mr-2">Show</span>
              <select className="border rounded px-2 py-1">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="ml-2">entries</span>
            </div>
            <div>
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Contact</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">Loading appointments...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-red-500">Error loading appointments: {error}</td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">No appointments found</td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment._id} className="border-b">
                      <td className="px-4 py-2">{appointment._id.substring(0, 8)}...</td>
                      <td className="px-4 py-2">{appointment.title}</td>
                      <td className="px-4 py-2">{getClientName(appointment.clientId)}</td>
                      <td className="px-4 py-2">{getClientPhone(appointment.clientId)}</td>
                      <td className="px-4 py-2">{formatDateTime(appointment.dateTime).date}</td>
                      <td className="px-4 py-2">{formatDateTime(appointment.dateTime).time}</td>
                      <td className="px-4 py-2">{appointment.duration} min</td>
                      <td className="px-4 py-2">
                        <select
                          value={appointment.status}
                          onChange={(e) => {
                            updateAppointmentStatus(appointment._id, e.target.value as Appointment['status']);
                          }}
                          className={`px-2 py-1 text-sm rounded-full ${getStatusColor(appointment.status)}`}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Rescheduled">Rescheduled</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(appointment._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              Showing {filteredAppointments.length} of {appointments.length} entries
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border rounded" disabled>
                Previous
              </button>
              <button className="px-3 py-1 border rounded" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAppointment ? 'Edit Appointment' : 'Add Appointment'}
            </h2>
            <form onSubmit={handleAddAppointment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Client
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dateTime: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: Number(e.target.value) })
                    }
                    min="15"
                    max="480"
                    step="15"
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ 
                        ...formData, 
                        status: e.target.value as Appointment['status'] 
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    {editingAppointment ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentPage;