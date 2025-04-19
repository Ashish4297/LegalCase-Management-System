import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api/services';

export interface Service {
  _id: string;
  name: string;
  amount: number;
  category: 'Consultation' | 'Litigation' | 'Documentation' | 'Other';
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
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
      
      setServices(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching services');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createService = useCallback(async (serviceData: Omit<Service, '_id'>) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(API_URL, serviceData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setServices(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error creating service');
      console.error('Error creating service:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateService = useCallback(async (id: string, serviceData: Partial<Service>) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(`${API_URL}/${id}`, serviceData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setServices(prev => 
        prev.map(service => service._id === id ? response.data : service)
      );
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating service');
      console.error('Error updating service:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteService = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setServices(prev => prev.filter(service => service._id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error deleting service');
      console.error('Error deleting service:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService
  };
} 