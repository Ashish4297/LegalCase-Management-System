import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, MoreVertical, AlertCircle, Loader2 } from 'lucide-react';
import { useClients, Client as ApiClient, ClientInput } from '../hooks/useClients';

function ClientPage() {
  const { clients, loading, error, fetchClients, addClient, updateClient, deleteClient } = useClients();
  
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ApiClient | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState<ClientInput>({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    notes: '',
    status: true // Default to active status
  });

  // Filter clients based on status
  const filteredClients = clients.filter(client => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return client.status === true;
    if (statusFilter === 'inactive') return client.status === false;
    return true;
  });

  // Fetch clients when component mounts
  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Authentication required");
      return;
    }
    
    fetchClients();
  }, [fetchClients]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      notes: '',
      status: true // Default to active status
    });
    setEditingClient(null);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert("Client name is required");
        return;
      }
      if (!formData.email.trim()) {
        alert("Email is required");
        return;
      }
      if (!formData.phone.trim()) {
        alert("Phone number is required");
        return;
      }

      if (editingClient) {
        // Edit existing client
        await updateClient(editingClient._id, formData);
      } else {
        // Add new client
        await addClient(formData);
      }
      
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      console.error("Error saving client:", err);
      const errorMessage = err.response?.data?.message || "Failed to save client. Please check your login status and try again.";
      alert(errorMessage);
    }
  };

  const handleEdit = (client: ApiClient) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address || '',
      company: client.company || '',
      notes: client.notes || '',
      status: client.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      // Ask if they want to permanently delete or just deactivate
      const deleteType = confirm(
        'Do you want to PERMANENTLY delete this client from the database?\n\n' +
        'Click OK to permanently delete (cannot be undone).\n' +
        'Click Cancel to just deactivate the client (can be reactivated later).'
      );
      
      try {
        // If true, use hard delete, otherwise use soft delete
        await deleteClient(id, !deleteType);
      } catch (err: any) {
        console.error("Error deleting client:", err);
        alert("Failed to delete client. Please try again.");
      }
    }
  };

  const toggleClientStatus = async (client: ApiClient) => {
    try {
      await updateClient(client._id, {
        ...client,
        status: !client.status
      });
    } catch (err: any) {
      console.error("Error updating client status:", err);
      alert("Failed to update client status. Please try again.");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <div className="flex space-x-2">
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-sm ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-sm ${
                statusFilter === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-sm ${
                statusFilter === 'inactive' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Inactive
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Client
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="mr-2" size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading clients...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {filteredClients.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {statusFilter !== 'all' 
                ? `No ${statusFilter} clients found.` 
                : 'No clients found. Click "Add Client" to create one.'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr 
                    key={client._id} 
                    className={`border-b ${!client.status ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-4 py-2">{client.name}</td>
                    <td className="px-4 py-2">{client.email}</td>
                    <td className="px-4 py-2">{client.phone}</td>
                    <td className="px-4 py-2">{client.company || '-'}</td>
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => toggleClientStatus(client)}
                        className={`px-2 py-1 text-sm rounded-full cursor-pointer ${
                          client.status ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {client.status ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit client"
                        >
                          <Pencil size={18} />
                        </button>
                        {client.status ? (
                          <button
                            onClick={() => handleDelete(client._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete client"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete inactive client "${client.name}"?`)) {
                                deleteClient(client._id, false); // Hard delete
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Permanently delete inactive client"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddClient}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter client name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <div className="flex items-center mt-2">
                    <label className="inline-flex items-center mr-4">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.status === true}
                        onChange={() => setFormData({ ...formData, status: true })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Active</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.status === false}
                        onChange={() => setFormData({ ...formData, status: false })}
                        className="form-radio h-4 w-4 text-red-600"
                      />
                      <span className="ml-2">Inactive</span>
                    </label>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter notes"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientPage;