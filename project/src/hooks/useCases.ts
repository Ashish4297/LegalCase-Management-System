import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api/cases';

export interface Case {
  _id: string;
  clientNo: string;
  clientName: string;
  caseType: string;
  court: string;
  courtNo?: string;
  magistrate?: string;
  petitioner: string;
  respondent: string;
  nextDate?: Date | string;
  status: 'Pending' | 'On-Trial' | 'Completed' | 'Dismissed';
  isImportant: boolean;
  isArchived: boolean;
  assignedTo: any; // This could be string ID or populated user object
  createdBy: any; // This could be string ID or populated user object
  documents?: Array<{
    title: string;
    fileUrl: string;
    uploadedAt: Date | string;
    uploadedBy: any;
  }>;
  appointments?: string[] | any[];
  timeline?: Array<{
    date: Date | string;
    description: string;
    addedBy: any;
  }>;
  notes?: Array<{
    content: string;
    createdAt: Date | string;
    createdBy: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CaseInput {
  clientNo: string;
  clientName: string;
  caseType: string;
  court: string;
  courtNo?: string;
  magistrate?: string;
  petitioner: string;
  respondent: string;
  nextDate?: string;
  status?: 'Pending' | 'On-Trial' | 'Completed' | 'Dismissed';
  isImportant?: boolean;
  assignedTo?: string;
  isArchived?: boolean;
}

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
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
      console.log('Cases API response:', response.status, typeof response.data);
      console.log('Response data structure:', JSON.stringify(response.data, null, 2));
      
      // Extract cases based on the server's response format
      // The server returns { success: true, message: 'Success', data: { cases: [...], total, page, totalPages } }
      let casesData = [];
      
      if (response.data && response.data.success) {
        // Standard API response format from the backend
        if (response.data.data && response.data.data.cases && Array.isArray(response.data.data.cases)) {
          casesData = response.data.data.cases;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          casesData = response.data.data;
        }
      } else if (response.data) {
        // Direct response format
        if (Array.isArray(response.data)) {
          casesData = response.data;
        } else if (response.data.cases && Array.isArray(response.data.cases)) {
          casesData = response.data.cases;
        }
      }
      
      console.log('Extracted cases data:', casesData ? casesData.length : 0);
      
      setCases(casesData);
    } catch (err: any) {
      setError(err.message || 'Error fetching cases');
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCase = useCallback(async (id: string) => {
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

      // Extract case from standard API response
      let caseData;
      if (response.data && response.data.success && response.data.data) {
        caseData = response.data.data;
      } else {
        caseData = response.data;
      }
      
      return caseData;
    } catch (err: any) {
      setError(err.message || 'Error fetching case');
      console.error('Error fetching case:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCase = useCallback(async (caseData: CaseInput) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication required');
      }

      // Get current user ID from token
      let userId = '';
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.userId || '';
          console.log('Using user ID from token for case creation:', userId);
        }
      } catch (err) {
        console.error('Failed to extract user ID from token:', err);
      }

      // Create a case payload with required fields
      const casePayload = {
        clientName: caseData.clientName,
        clientNo: caseData.clientNo,
        caseType: caseData.caseType,
        court: caseData.court,
        petitioner: caseData.petitioner,
        respondent: caseData.respondent,
        status: caseData.status || 'Pending',
        // Include assignedTo field which is required by the server model
        assignedTo: caseData.assignedTo || userId || '64f5e5d0e5f115b6e9a6b2d0'
      };

      // Debug the payload
      console.log('Sending case data to server:', JSON.stringify(casePayload, null, 2));

      // Use fetch API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(casePayload)
      });

      // Log the full response text first
      const responseText = await response.text();
      console.log('Server response text:', responseText);
      
      // Handle non-2xx responses
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${responseText}`);
      }

      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      console.log('Server response for add case:', response.status, responseData);

      // Extract case from standard API response
      let addedCase;
      if (responseData && responseData.success && responseData.data) {
        addedCase = responseData.data;
      } else {
        addedCase = responseData;
      }
      
      setCases(prev => [...prev, addedCase]);
      return addedCase;
    } catch (err: any) {
      // Enhanced error logging
      console.error('Error adding case:', err);
      setError(err.message || 'Error adding case');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCase = useCallback(async (id: string, caseData: Partial<CaseInput>) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication required');
      }

      // Clean the data to avoid sending empty strings for optional fields
      const cleanedData = Object.entries(caseData).reduce((acc, [key, value]) => {
        // Include empty strings for courtNo and magistrate
        if (key === 'courtNo' || key === 'magistrate') {
          acc[key] = value; // Include these even if empty
        }
        // Don't include undefined or null values
        else if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Debug the payload
      console.log('Updating case data:', JSON.stringify(cleanedData, null, 2));

      const response = await axios.put(`${API_URL}/${id}`, cleanedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Extract case from standard API response
      let updatedCase;
      if (response.data && response.data.success && response.data.data) {
        updatedCase = response.data.data;
      } else {
        updatedCase = response.data;
      }
      
      setCases(prev => prev.map(caseItem => caseItem._id === id ? updatedCase : caseItem));
      return updatedCase;
    } catch (err: any) {
      setError(err.message || 'Error updating case');
      console.error('Error updating case:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCase = useCallback(async (id: string) => {
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
      
      setCases(prev => prev.filter(caseItem => caseItem._id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error deleting case');
      console.error('Error deleting case:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (caseId: string, file: File) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('document', file);

      const response = await axios.post(`${API_URL}/${caseId}/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Extract case from standard API response
      let updatedCase;
      if (response.data && response.data.success && response.data.data) {
        updatedCase = response.data.data;
      } else {
        updatedCase = response.data;
      }
      
      setCases(prev => prev.map(caseItem => caseItem._id === caseId ? updatedCase : caseItem));        
      return updatedCase;
    } catch (err: any) {
      setError(err.message || 'Error uploading document');
      console.error('Error uploading document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return {
    cases,
    loading,
    error,
    fetchCases,
    getCase,
    addCase,
    updateCase,
    deleteCase,
    uploadDocument
  };
} 