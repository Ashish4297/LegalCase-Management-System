import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/team-members';

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  position: string;
  role: 'Admin' | 'Attorney' | 'Paralegal' | 'Assistant' | 'Other';
  phoneNumber?: string;
  dateJoined: string;
  profileImageUrl?: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  specializations: string[];
  createdAt: string;
  updatedAt: string;
}

export function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
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
      
      setTeamMembers(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching team members');
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTeamMember = useCallback(async (
    teamMemberData: Omit<TeamMember, '_id' | 'createdAt' | 'updatedAt'>, 
    profileImage?: File
  ) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Ensure dateJoined is a valid ISO string
      if (teamMemberData.dateJoined && !(teamMemberData.dateJoined instanceof Date)) {
        try {
          // Try to convert to a valid date then to ISO string
          const dateObj = new Date(teamMemberData.dateJoined);
          if (!isNaN(dateObj.getTime())) {
            teamMemberData = {
              ...teamMemberData,
              dateJoined: dateObj.toISOString()
            };
          } else {
            // If invalid date, use current date
            teamMemberData = {
              ...teamMemberData,
              dateJoined: new Date().toISOString()
            };
          }
        } catch (e) {
          // If error in conversion, use current date
          teamMemberData = {
            ...teamMemberData,
            dateJoined: new Date().toISOString()
          };
        }
      }
      
      let response;
      
      if (profileImage) {
        // If there's a profile image, use FormData
        const formData = new FormData();
        // Add all team member data to FormData
        Object.entries(teamMemberData).forEach(([key, value]) => {
          if (key === 'specializations' && Array.isArray(value)) {
            // Handle arrays by converting to JSON string
            formData.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            // Only append defined, non-null values
            formData.append(key, String(value));
          }
        });
        
        // Add the profile image
        formData.append('profileImage', profileImage);
        
        // Send the request with FormData
        response = await axios.post(`${API_URL}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // No profile image, use regular JSON request
        // Create a clean copy of data without undefined or null values
        const cleanData = Object.fromEntries(
          Object.entries(teamMemberData).filter(([_, v]) => v !== undefined && v !== null)
        );
        
        response = await axios.post(API_URL, cleanData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      setTeamMembers(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error adding team member');
      console.error('Error adding team member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTeamMember = useCallback(async (
    id: string, 
    teamMemberData: Partial<TeamMember>,
    profileImage?: File
  ) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      let response;
      
      if (profileImage) {
        // If there's a profile image, use FormData
        const formData = new FormData();
        // Add all team member data to FormData
        Object.entries(teamMemberData).forEach(([key, value]) => {
          if (key === 'specializations' && Array.isArray(value)) {
            // Handle arrays by converting to JSON string
            formData.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            // Only append defined, non-null values
            formData.append(key, String(value));
          }
        });
        
        // Add the profile image
        formData.append('profileImage', profileImage);
        
        // Send the request with FormData
        response = await axios.put(`${API_URL}/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // No profile image, use regular JSON request
        // Create a clean copy of data without undefined or null values
        const cleanData = Object.fromEntries(
          Object.entries(teamMemberData).filter(([_, v]) => v !== undefined && v !== null)
        );
        
        response = await axios.put(`${API_URL}/${id}`, cleanData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      setTeamMembers(prev => 
        prev.map(member => member._id === id ? response.data : member)
      );
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating team member');
      console.error('Error updating team member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTeamMember = useCallback(async (id: string) => {
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
      
      setTeamMembers(prev => prev.filter(member => member._id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error deleting team member');
      console.error('Error deleting team member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  return {
    teamMembers,
    loading,
    error,
    fetchTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember
  };
} 