import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, MoreVertical, Search, Plus, Upload, X, AlertCircle, User } from 'lucide-react';
import { useTeamMembers, TeamMember } from '../hooks/useTeamMembers';

// Local interface for form state
interface TeamMemberFormData {
  name: string;
  email: string;
  phoneNumber: string;
  position: string;
  role: string;
  specializations: string;
  status: string;
  profileImageUrl: string;
}

function TeamMemberPage() {
  const { 
    teamMembers, 
    loading, 
    error: apiError, 
    fetchTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember
  } = useTeamMembers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    position: '',
    role: 'Attorney',
    specializations: '',
    status: 'Active',
    profileImageUrl: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form error when form data changes
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [formData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image file size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setFormError('Only JPG, PNG and GIF files are allowed');
        return;
      }
      
      // Set the file for later upload
      setProfileImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setFormData({ ...formData, profileImageUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = (): boolean => {
    // Basic validation
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.position.trim()) {
      setFormError('Position is required');
      return false;
    }
    
    return true;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormError(null);
    
    // Validate form data
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare specializations array with empty check
      const specializations = formData.specializations 
        ? formData.specializations.split(',').map(item => item.trim()).filter(Boolean)
        : [];
      
      if (editingMember) {
        // Update existing member
        await updateTeamMember(editingMember._id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          position: formData.position.trim(),
          role: formData.role as TeamMember['role'],
          status: formData.status as TeamMember['status'],
          specializations: specializations,
          // profileImageUrl is handled by the file upload
        }, profileImage || undefined);
      } else {
        // Add new member
        await addTeamMember({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          position: formData.position.trim(),
          role: formData.role as TeamMember['role'],
          status: formData.status as TeamMember['status'],
          specializations: specializations,
          // profileImageUrl is handled by the file upload
          dateJoined: new Date().toISOString()
        }, profileImage || undefined);
      }
      
      setShowForm(false);
      resetForm();
      fetchTeamMembers(); // Refresh the list after adding/updating
    } catch (err: any) {
      console.error('Error saving team member:', err);
      
      // Extract error message from response
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          setFormError(err.response.data.message);
        } else if (err.response.data.error) {
          setFormError(err.response.data.error);
        } else {
          setFormError('An error occurred while saving the team member');
        }
      } else {
        setFormError(err.message || 'An error occurred while saving the team member');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phoneNumber: member.phoneNumber || '',
      position: member.position,
      role: member.role,
      specializations: member.specializations.join(', '),
      status: member.status,
      profileImageUrl: member.profileImageUrl || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        await deleteTeamMember(id);
      } catch (err) {
        console.error('Error deleting team member:', err);
      }
    }
  };

  const getRoleBadgeColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Attorney':
        return 'bg-blue-100 text-blue-800';
      case 'Paralegal':
        return 'bg-green-100 text-green-800';
      case 'Assistant':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      position: '',
      role: 'Attorney',
      specializations: '',
      status: 'Active',
      profileImageUrl: ''
    });
    setProfileImage(null);
    setEditingMember(null);
    
    // Reset file input if exists
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, profileImageUrl: '' });
    setProfileImage(null);
    
    // Reset file input if exists
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to get the full image URL
  const getProfileImageUrl = (url?: string) => {
    if (!url) return null;
    
    // If the URL is already a data URL (base64), use it directly
    if (url.startsWith('data:')) {
      return url;
    }
    
    // Otherwise, prefix with the server URL
    return `http://localhost:5000${url}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Team Members</h1>
        <button
          onClick={() => {
            setEditingMember(null);
            setFormData({
              name: '',
              email: '',
              phoneNumber: '',
              position: '',
              role: 'Attorney',
              specializations: '',
              status: 'Active',
              profileImageUrl: ''
            });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center">
              <span className="mr-2">Show</span>
              <select className="border rounded px-2 py-1">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="ml-2">entries</span>
            </div>
            <div className="w-full sm:w-auto">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 border rounded-lg pl-10 pr-4 py-2"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Member</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member._id} className="border-b">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        {member.profileImageUrl ? (
                          <img
                            src={getProfileImageUrl(member.profileImageUrl)}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User size={18} className="text-gray-500" />
                          </div>
                        )}
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">{member.email}</td>
                    <td className="px-4 py-2">{member.phoneNumber}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-sm rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-sm rounded-full ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(member._id)}
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              Showing {filteredMembers.length} of {teamMembers.length} entries
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

      {/* Add/Edit Member Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
            </h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-32 h-32 relative mb-2">
                  {formData.profileImageUrl ? (
                    <>
                      <img
                        src={formData.profileImageUrl}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <User size={40} className="text-gray-500" />
                    </div>
                  )}
                </div>
                
                <label className="cursor-pointer bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-2">
                  <Upload size={18} />
                  Upload Profile Picture
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  name="name"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  name="email"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  name="phoneNumber"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={handleInputChange}
                  name="position"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={handleInputChange}
                  name="role"
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="Admin">Admin</option>
                  <option value="Attorney">Attorney</option>
                  <option value="Paralegal">Paralegal</option>
                  <option value="Assistant">Assistant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Specializations
                </label>
                <textarea
                  value={formData.specializations}
                  onChange={handleInputChange}
                  name="specializations"
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
                  onChange={handleInputChange}
                  name="status"
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start mb-4">
                  <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>Loading...</>
                  ) : (
                    <>{editingMember ? 'Update' : 'Save'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamMemberPage;