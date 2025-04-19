import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api/clients';

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;  // Used by frontend forms
  mobile: string; // Used by backend (will map phone to this)
  address?: string;
  company?: string;
  notes?: string;
  status: boolean;
  cases?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
  notes?: string;
  status?: boolean;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Debug logging
      console.log('Client API response:', response.status, typeof response.data);
      console.log('Response data structure:', JSON.stringify(response.data, null, 2));
      
      // Extract clients based on the server's response format
      // The server returns { success: true, message: 'Success', data: { clients: [...], total, page, totalPages } }
      let clientsData = [];
      
      if (response.data && response.data.success) {
        // Standard API response format from the backend
        if (response.data.data && response.data.data.clients && Array.isArray(response.data.data.clients)) {
          clientsData = response.data.data.clients;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          clientsData = response.data.data;
        }
      } else if (response.data) {
        // Direct response format
        if (Array.isArray(response.data)) {
          clientsData = response.data;
        } else if (response.data.clients && Array.isArray(response.data.clients)) {
          clientsData = response.data.clients;
        }
      }
      
      console.log('Extracted clients data:', clientsData ? clientsData.length : 0);
      
      // Now safely map the array
      const clientsWithCorrectFields = clientsData.map((client) => ({
        ...client,
        phone: client.mobile || client.phone || '',  // Use mobile from backend for phone field
      }));
      
      setClients(clientsWithCorrectFields);
    } catch (err: any) {
      setError(err.message || 'Error fetching clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getClient = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Extract client from standard API response
      let clientData;
      if (response.data && response.data.success && response.data.data) {
        clientData = response.data.data;
      } else {
        clientData = response.data;
      }
      
      // Map mobile to phone
      if (clientData && clientData.mobile) {
        clientData.phone = clientData.mobile;
      }
      
      return clientData;
    } catch (err: any) {
      setError(err.message || 'Error fetching client');
      console.error('Error fetching client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addClient = useCallback(async (clientData: ClientInput) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Map phone to mobile for backend compatibility
      const backendData = {
        ...clientData,
        mobile: clientData.phone // Ensure mobile field is set for backend
      };
      
      // Remove phone property as it's not needed for backend
      if ('phone' in backendData) {
        delete backendData.phone;
      }
      
      // Generate temporary ID for optimistic update
      const tempId = 'temp_' + Date.now();
      
      // Create optimistic client object
      const optimisticClient = {
        _id: tempId,
        ...clientData,
        status: clientData.status !== undefined ? clientData.status : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mobile: clientData.phone || '',
        phone: clientData.phone || '' // Ensure phone is set for frontend
      };
      
      // Optimistically add to UI
      setClients(prev => [...prev, optimisticClient]);
      
      // Send to the server
      const response = await axios.post(API_URL, backendData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Extract client from standard API response
      let addedClient;
      if (response.data && response.data.success && response.data.data) {
        addedClient = response.data.data;
      } else {
        addedClient = response.data;
      }
      
      // Map mobile back to phone for frontend consistency
      if (addedClient && addedClient.mobile) {
        addedClient.phone = addedClient.mobile;
      }
      
      // Replace the temporary client with the real one from the server
      setClients(prev => prev.map(client => 
        client._id === tempId ? addedClient : client
      ));
      
      return addedClient;
    } catch (err: any) {
      // If error, refresh clients list to restore correct state
      fetchClients().catch(fetchErr => 
        console.error('Failed to refresh clients after add error:', fetchErr)
      );
      
      setError(err.message || 'Error adding client');
      console.error('Error adding client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchClients]);

  const updateClient = useCallback(async (id: string, clientData: Partial<ClientInput>) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Map phone to mobile for backend compatibility
      const backendData = {
        ...clientData,
        mobile: clientData.phone  // Map phone to mobile for backend
      };
      
      // Remove phone property as it's not needed for backend
      if ('phone' in backendData) {
        delete backendData.phone;
      }
      
      // Get the current client to merge with updates for optimistic UI update
      const currentClient = clients.find(client => client._id === id);
      if (currentClient) {
        // Create optimistically updated client
        const optimisticClient = {
          ...currentClient,
          ...clientData,
          // Ensure phone is properly set for frontend
          phone: clientData.phone || currentClient.phone
        };
        
        // Optimistically update the UI
        setClients(prev => 
          prev.map(client => client._id === id ? optimisticClient : client)
        );
      }
      
      // Send update to the server
      const response = await axios.put(`${API_URL}/${id}`, backendData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Extract client from standard API response
      let updatedClient;
      if (response.data && response.data.success && response.data.data) {
        updatedClient = response.data.data;
      } else {
        updatedClient = response.data;
      }
      
      // Map mobile back to phone for frontend consistency
      if (updatedClient && updatedClient.mobile) {
        updatedClient.phone = updatedClient.mobile;
      }
      
      // Update with the actual server response
      setClients(prev => prev.map(client => client._id === id ? updatedClient : client));
      return updatedClient;
    } catch (err: any) {
      // If there's an error, refresh the list to restore correct state
      fetchClients().catch(fetchErr => 
        console.error('Failed to refresh clients after update error:', fetchErr)
      );
      
      setError(err.message || 'Error updating client');
      console.error('Error updating client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clients, fetchClients]);

  const deleteClient = useCallback(async (id: string, useSoftDelete = false) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Optimistically update the UI by removing the client immediately
      setClients(prev => prev.filter(client => client._id !== id));
      
      // Then send the delete request to the server
      // Add query param for soft delete if requested
      const url = useSoftDelete ? `${API_URL}/${id}?soft=true` : `${API_URL}/${id}`;
      
      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Client deleted successfully:', id);
      return true;
    } catch (err: any) {
      // If there's an error, we need to fetch the clients again to restore the correct state
      fetchClients().catch(fetchErr => 
        console.error('Failed to refresh clients after delete error:', fetchErr)
      );
      
      setError(err.message || 'Error deleting client');
      console.error('Error deleting client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchClients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    getClient,
    addClient,
    updateClient,
    deleteClient
  };
} 