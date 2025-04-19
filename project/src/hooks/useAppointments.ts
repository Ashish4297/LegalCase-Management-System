import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api/appointments';

export interface Appointment {
  _id: string;
  title: string;
  clientId: string;
  dateTime: string;
  duration: number;
  location: string;
  description: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentInput {
  title: string;
  clientId: string;
  dateTime: string;
  duration: number;
  location: string;
  description: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
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
      
      setAppointments(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAppointmentsByClient = useCallback(async (clientId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/client/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error fetching client appointments');
      console.error('Error fetching client appointments:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addAppointment = useCallback(async (appointmentData: AppointmentInput) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(API_URL, appointmentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAppointments(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error adding appointment');
      console.error('Error adding appointment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppointment = useCallback(async (id: string, appointmentData: Partial<AppointmentInput>) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(`${API_URL}/${id}`, appointmentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAppointments(prev => prev.map(appointment => appointment._id === id ? response.data : appointment));
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating appointment');
      console.error('Error updating appointment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
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
      
      setAppointments(prev => prev.filter(appointment => appointment._id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error deleting appointment');
      console.error('Error deleting appointment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (id: string, status: Appointment['status']) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.patch(`${API_URL}/${id}/status`, { status }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAppointments(prev => prev.map(appointment => appointment._id === id ? response.data : appointment));
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating appointment status');
      console.error('Error updating appointment status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    fetchAppointmentsByClient,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus
  };
} 