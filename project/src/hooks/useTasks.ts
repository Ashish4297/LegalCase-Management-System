import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api/tasks';

export interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  completed?: boolean;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
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
      
      setTasks(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTask = useCallback(async (taskData: TaskInput) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(API_URL, taskData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setTasks(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error adding task');
      console.error('Error adding task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (id: string, taskData: Partial<TaskInput>) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(`${API_URL}/${id}`, taskData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setTasks(prev => prev.map(task => task._id === id ? response.data : task));
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating task');
      console.error('Error updating task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
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
      
      setTasks(prev => prev.filter(task => task._id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error deleting task');
      console.error('Error deleting task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleTaskCompletion = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.patch(`${API_URL}/${id}/toggle`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setTasks(prev => prev.map(task => task._id === id ? response.data : task));
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error toggling task completion');
      console.error('Error toggling task completion:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion
  };
} 