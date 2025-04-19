import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api/invoices';

export interface InvoiceItem {
  service: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  invoiceNo: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paid: number;
  balanceDue: number; // Virtual property
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';
  clientStatus: 'Viewed' | 'Not Viewed';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceInput {
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  items: Omit<InvoiceItem, '_id'>[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  notes?: string;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Log token format (first few characters)
      console.log('Using token (first 10 chars):', token.substring(0, 10) + '...');
      
      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Log success
        console.log('Successfully fetched invoices:', response.data.length);
        setInvoices(response.data);
      } catch (axiosError: any) {
        // More detailed error handling for Axios errors
        if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Server response error:', {
            status: axiosError.response.status,
            data: axiosError.response.data,
            headers: axiosError.response.headers
          });
          
          if (axiosError.response.status === 400) {
            setError(`Bad Request (400): ${JSON.stringify(axiosError.response.data)}`);
          } else if (axiosError.response.status === 401) {
            setError('Authentication failed: Token may be invalid or expired');
            // Clear token if it's invalid
            localStorage.removeItem('token');
          } else {
            setError(`Request failed with status code ${axiosError.response.status}`);
          }
        } else if (axiosError.request) {
          // The request was made but no response was received
          console.error('No response received:', axiosError.request);
          setError('No response from server. Please check your connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request setup error:', axiosError.message);
          setError(`Error setting up request: ${axiosError.message}`);
        }
        throw axiosError; // Re-throw for further handling if needed
      }
    } catch (err: any) {
      console.error('Error in fetchInvoices:', err);
      if (!error) { // Only set error if not already set in the Axios block
        setError(err.message || 'Error fetching invoices');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoicesByClient = useCallback(async (clientId: string) => {
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
      setError(err.message || 'Error fetching client invoices');
      console.error('Error fetching client invoices:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (invoiceData: InvoiceInput) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(API_URL, invoiceData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setInvoices(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error creating invoice');
      console.error('Error creating invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvoice = useCallback(async (id: string, invoiceData: Partial<InvoiceInput>) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(`${API_URL}/${id}`, invoiceData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setInvoices(prev => 
        prev.map(invoice => invoice._id === id ? response.data : invoice)
      );
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating invoice');
      console.error('Error updating invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
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
      
      setInvoices(prev => prev.filter(invoice => invoice._id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error deleting invoice');
      console.error('Error deleting invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvoiceStatus = useCallback(async (id: string, status: Invoice['status']) => {
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
      
      setInvoices(prev => 
        prev.map(invoice => invoice._id === id ? response.data : invoice)
      );
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating invoice status');
      console.error('Error updating invoice status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markInvoiceAsViewed = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.patch(`${API_URL}/${id}/mark-viewed`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setInvoices(prev => 
        prev.map(invoice => invoice._id === id ? response.data : invoice)
      );
      return response.data;
    } catch (err: any) {
      console.error('Error marking invoice as viewed:', err);
      throw err;
    }
  }, []);

  const recordPayment = useCallback(async (id: string, amount: number) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${API_URL}/${id}/payments`, { amount }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setInvoices(prev => 
        prev.map(invoice => invoice._id === id ? response.data : invoice)
      );
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error recording payment');
      console.error('Error recording payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    fetchInvoicesByClient,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    markInvoiceAsViewed,
    recordPayment
  };
} 