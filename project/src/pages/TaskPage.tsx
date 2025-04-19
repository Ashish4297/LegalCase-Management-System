import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, MoreVertical, AlertCircle, Loader2 } from 'lucide-react';
import { useTasks, Task as ApiTask, TaskInput } from '../hooks/useTasks';

// Local interface for form management
interface FormData {
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
}

function TaskPage() {
  const { tasks, loading, error, fetchTasks, addTask, updateTask, deleteTask, toggleTaskCompletion } = useTasks();
  
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    priority: 'Medium'
  });

  // Add useEffect to fetch tasks when component mounts
  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log("Auth Status:", {
      hasToken: !!token,
      hasUser: !!user
    });
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log("User info:", {
          id: userData.id,
          role: userData.role
        });
      } catch (e) {
        console.error("Error parsing user data");
      }
    }

    // Fetch tasks
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First check for authentication
      const token = localStorage.getItem('token');
      console.log("Auth token exists:", !!token);
      if (token) {
        console.log("Token starts with:", token.substring(0, 15) + "...");
      } else {
        alert("You are not logged in. Please log in to add tasks.");
        return;
      }

      if (!formData.title.trim()) {
        alert("Task title is required");
        return;
      }

      // Validate date
      try {
        const date = new Date(formData.dueDate);
        if (isNaN(date.getTime())) {
          alert("Invalid due date format");
          return;
        }
      } catch (e) {
        alert("Invalid due date");
        return;
      }

      // Make sure the date is properly formatted for the API
      const formattedData = {
        ...formData,
        // Convert date string to ISO format
        dueDate: new Date(formData.dueDate).toISOString()
      };

      console.log("Sending task data:", formattedData);

      if (editingTask) {
        // Edit existing task
        await updateTask(editingTask._id, formattedData);
      } else {
        // Add new task
        await addTask(formattedData);
      }
      
      setShowModal(false);
      resetForm();
      // Refresh tasks list
      await fetchTasks();
    } catch (err: any) {
      console.error("Error saving task:", err);
      
      // Extract detailed error message from response if available
      let errorMessage = "Failed to save task. Please check your login status and try again.";
      
      if (err.response) {
        console.log("Error response data:", err.response.data);
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        if (err.response.data && err.response.data.details) {
          errorMessage += ` (${err.response.data.details})`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      priority: 'Medium'
    });
    setEditingTask(null);
  };

  const handleEdit = (task: ApiTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      status: task.status,
      priority: task.priority
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      await toggleTaskCompletion(id);
    } catch (err) {
      console.error("Error toggling task completion:", err);
    }
  };

  const getStatusColor = (status: ApiTask['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: ApiTask['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // Add a helper function to format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <button
          onClick={() => {
            setEditingTask(null);
            setFormData({
              title: '',
              description: '',
              dueDate: new Date().toISOString().split('T')[0],
              status: 'Pending',
              priority: 'Medium'
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Task
        </button>
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
          <span className="ml-2 text-gray-600">Loading tasks...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No tasks found. Click "Add Task" to create one.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Task Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Start Date</th>
                  <th className="px-4 py-2 text-left">Due Date</th>
                  <th className="px-4 py-2 text-left">Priority</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-b">
                    <td className="px-4 py-2">{task._id.substring(0, 8)}...</td>
                    <td className="px-4 py-2">{task.title}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-sm rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{formatDate(task.startDate)}</td>
                    <td className="px-4 py-2">{formatDate(task.dueDate)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-sm rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleComplete(task._id)}
                          className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 border rounded"
                        >
                          {task.status === 'Completed' ? 'Mark Incomplete' : 'Mark Complete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingTask ? 'Edit Task' : 'Add New Task'}
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

            <form onSubmit={handleAddTask}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter task title"
                    required
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
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                      required
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
                          status: e.target.value as any,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
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
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskPage;