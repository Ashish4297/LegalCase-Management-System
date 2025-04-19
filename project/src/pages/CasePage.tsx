import React, { useState, useEffect } from 'react';
import { Star, Pencil, Trash2, MoreVertical, X } from 'lucide-react';
import { useCases, Case, CaseInput } from '../hooks/useCases';

type TabType = 'running' | 'important' | 'archived';

function CasePage() {
  const { cases, loading, error, fetchCases, addCase, updateCase, deleteCase } = useCases();
  const [activeTab, setActiveTab] = useState<TabType>('running');
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [formData, setFormData] = useState<CaseInput>({
    clientName: '',
    clientNo: '',
    caseType: '',
    court: '',
    courtNo: '',
    magistrate: '',
    petitioner: '',
    respondent: '',
    nextDate: '',
    status: 'Pending',
    assignedTo: '',
    isImportant: false
  });

  // Reset form when modal is closed
  useEffect(() => {
    if (!showModal) {
      setEditingCase(null);
      setFormData({
        clientName: '',
        clientNo: '',
        caseType: '',
        court: '',
        courtNo: '',
        magistrate: '',
        petitioner: '',
        respondent: '',
        nextDate: '',
        status: 'Pending',
        assignedTo: '',
        isImportant: false
      });
    }
  }, [showModal]);

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log form data for debugging
    console.log('Form data before submission:', formData);
    console.log('Court No:', formData.courtNo);
    console.log('Magistrate:', formData.magistrate);
    
    // Validate form data before submitting
    const requiredFields = ['clientName', 'clientNo', 'caseType', 'court', 'petitioner', 'respondent'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof CaseInput]?.trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Get current user ID from token
    let userId = '';
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.userId || '';
          console.log('Using user ID from token:', userId);
        }
      }
    } catch (err) {
      console.error('Failed to extract user ID from token:', err);
    }
    
    // Validate assignedTo is a valid MongoDB ObjectId
    let assignedTo = formData.assignedTo || userId;
    // Check if assignedTo is a valid MongoDB ObjectId (24 hex chars)
    const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
    
    if (!isValidObjectId(assignedTo)) {
      console.warn('Invalid assignedTo value:', assignedTo);
      // Fall back to userId from token if it's valid, otherwise use a hardcoded ID
      assignedTo = isValidObjectId(userId) ? userId : '64f5e5d0e5f115b6e9a6b2d0';
    }
    
    // Create a payload with all required fields
    const casePayload = {
      clientName: formData.clientName.trim(),
      clientNo: formData.clientNo.trim(),
      caseType: formData.caseType.trim(),
      court: formData.court.trim(),
      courtNo: formData.courtNo?.trim(),
      magistrate: formData.magistrate?.trim(),
      petitioner: formData.petitioner.trim(),
      respondent: formData.respondent.trim(),
      nextDate: formData.nextDate || undefined,
      status: formData.status as 'Pending' | 'On-Trial' | 'Completed' | 'Dismissed',
      isImportant: formData.isImportant,
      // Use validated assignedTo value
      assignedTo
    };
    
    console.log('Submitting case data:', casePayload);
    
    try {
      if (editingCase) {
        // Edit existing case
        const updatePayload = {
          ...formData,
          // Explicitly include these fields even if empty
          courtNo: formData.courtNo,
          magistrate: formData.magistrate
        };
        console.log('Update payload:', updatePayload);
        await updateCase(editingCase._id, updatePayload);
      } else {
        try {
          // Try to add case using the hook
          await addCase(casePayload);
        } catch (hookError) {
          console.error('Hook method failed, trying direct fetch:', hookError);
          
          // If the hook method fails, try direct fetch as fallback
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Authentication required');
          }
          
          const response = await fetch('http://localhost:5000/api/cases', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(casePayload)
          });
          
          // Get the full response text first
          const responseText = await response.text();
          console.log('Direct fetch response:', response.status, responseText);
          
          if (!response.ok) {
            throw new Error(`Server error: ${response.status} - ${responseText}`);
          }
          
          // Try to parse the response text as JSON
          try {
            const result = JSON.parse(responseText);
            console.log('Direct fetch success:', result);
            
            // Refresh the case list
            fetchCases();
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error(`Failed to parse server response: ${responseText.substring(0, 100)}`);
          }
        }
      }
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving case:', err);
      alert(`Failed to save case: ${err.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (c: Case) => {
    setEditingCase(c);
    console.log('Editing case:', c);
    setFormData({
      clientName: c.clientName || '',
      clientNo: c.clientNo || '',
      caseType: c.caseType || '',
      court: c.court || '',
      courtNo: c.courtNo || '',
      magistrate: c.magistrate || '',
      petitioner: c.petitioner || '',
      respondent: c.respondent || '',
      nextDate: c.nextDate ? new Date(c.nextDate).toISOString().split('T')[0] : '',
      status: c.status || 'Pending',
      assignedTo: c.assignedTo?._id || c.assignedTo || '',
      isImportant: c.isImportant || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this case?')) {
      try {
        await deleteCase(id);
      } catch (err) {
        console.error('Error deleting case:', err);
        alert('Error deleting case. Please try again.');
      }
    }
  };

  const handleToggleImportant = async (c: Case) => {
    try {
      await updateCase(c._id, { 
        ...c,
        isImportant: !c.isImportant 
      });
    } catch (err) {
      console.error('Error updating case:', err);
    }
  };

  const filteredCases = cases.filter(c => {
    switch (activeTab) {
      case 'important':
        return c.isImportant && !c.isArchived;
      case 'archived':
        return c.isArchived;
      case 'running':
        return !c.isArchived;
      default:
        return true;
    }
  });

  const handleSearch = () => {
    // Implement date range search logic here
    console.log('Searching with date range:', dateRange);
  };

  const handleClear = () => {
    setDateRange({ from: '', to: '' });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Cases</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingCase(null);
              setFormData({
                clientName: '',
                clientNo: '',
                caseType: '',
                court: '',
                courtNo: '',
                magistrate: '',
                petitioner: '',
                respondent: '',
                nextDate: '',
                status: 'Pending',
                assignedTo: '',
                isImportant: false
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Case
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Next Date:
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Next Date:
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
            >
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-4 px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('running')}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'running'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Running Cases
            </button>
            <button
              onClick={() => setActiveTab('important')}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'important'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Important Cases
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'archived'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Archived Cases
            </button>
          </nav>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="mr-2">Show</span>
              <select className="border rounded px-2 py-1">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="ml-2">entries</span>
            </div>
            <div>
              <input
                type="search"
                placeholder="Search..."
                className="border rounded px-3 py-1"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">No</th>
                  <th className="px-4 py-2 text-left">Client & Case Detail</th>
                  <th className="px-4 py-2 text-left">Court Detail</th>
                  <th className="px-4 py-2 text-left">Petitioner vs Respondent</th>
                  <th className="px-4 py-2 text-left">Next Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c._id} className="border-b">
                    <td className="px-4 py-2">{c.clientNo}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleImportant(c)}
                          className={`${
                            c.isImportant ? 'text-yellow-500' : 'text-gray-400'
                          } hover:text-yellow-600`}
                        >
                          <Star size={18} fill={c.isImportant ? 'currentColor' : 'none'} />
                        </button>
                        <div>
                          <div className="font-medium">{c.clientName}</div>
                          <div className="text-sm text-gray-500">No: {c.clientNo}</div>
                          <div className="text-sm text-gray-500">Case: {c.caseType}</div>
                          {c.assignedTo && (
                            <div className="text-sm text-gray-500">
                              Assigned To: {
                                typeof c.assignedTo === 'object' && c.assignedTo?.name 
                                  ? c.assignedTo.name 
                                  : 'Not Assigned'
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <div>Court: {c.court}</div>
                        <div className="text-sm text-gray-500">No: {c.courtNo}</div>
                        <div className="text-sm text-gray-500">
                          Magistrate: {c.magistrate}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        {c.petitioner}
                        <div className="text-sm text-gray-500">VS</div>
                        {c.respondent}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {c.nextDate 
                        ? new Date(c.nextDate).toLocaleDateString() 
                        : 'Not scheduled'
                      }
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
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
              Showing {filteredCases.length} of {cases.length} entries
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

      {/* Add/Edit Case Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowModal(false)}
            ></div>

            {/* Modal Content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-[800px] w-full max-h-[90vh] relative z-50">
              <div className="bg-white p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editingCase ? 'Edit Case' : 'Add New Case'}
                </h2>
                <form onSubmit={handleAddCase} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Name *
                      </label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) =>
                          setFormData({ ...formData, clientName: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client No *
                      </label>
                      <input
                        type="text"
                        value={formData.clientNo}
                        onChange={(e) =>
                          setFormData({ ...formData, clientNo: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Case Type *
                      </label>
                      <input
                        type="text"
                        value={formData.caseType}
                        onChange={(e) =>
                          setFormData({ ...formData, caseType: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Court *
                      </label>
                      <input
                        type="text"
                        value={formData.court}
                        onChange={(e) =>
                          setFormData({ ...formData, court: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Court No
                      </label>
                      <input
                        type="text"
                        value={formData.courtNo}
                        onChange={(e) =>
                          setFormData({ ...formData, courtNo: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Magistrate
                      </label>
                      <input
                        type="text"
                        value={formData.magistrate}
                        onChange={(e) =>
                          setFormData({ ...formData, magistrate: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Petitioner *
                      </label>
                      <input
                        type="text"
                        value={formData.petitioner}
                        onChange={(e) =>
                          setFormData({ ...formData, petitioner: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Respondent *
                      </label>
                      <input
                        type="text"
                        value={formData.respondent}
                        onChange={(e) =>
                          setFormData({ ...formData, respondent: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Next Date
                      </label>
                      <input
                        type="date"
                        value={formData.nextDate}
                        onChange={(e) =>
                          setFormData({ ...formData, nextDate: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="Pending">Pending</option>
                        <option value="On-Trial">On-Trial</option>
                        <option value="Completed">Completed</option>
                        <option value="Dismissed">Dismissed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Assigned To (User ID)
                      </label>
                      <input
                        type="text"
                        value={formData.assignedTo}
                        onChange={(e) =>
                          setFormData({ ...formData, assignedTo: e.target.value })
                        }
                        placeholder="Use a valid MongoDB ID (24 hex chars) or leave empty"
                        className="w-full border rounded px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be a valid user ID. Will use your ID if left empty.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {editingCase ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CasePage;