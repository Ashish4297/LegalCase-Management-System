import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, MoreVertical, Search, Plus, Calendar } from 'lucide-react';
import { useInvoices, Invoice } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { format } from 'date-fns';

function InvoicePage() {
  const { invoices, loading, error, fetchInvoices, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus } = useInvoices();
  const { clients } = useClients();
  
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    total: '',
    paid: '',
    issueDate: '',
    dueDate: '',
    items: [{
      service: '',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }],
    notes: '',
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0
  });

  // Add a useEffect to recalculate totals whenever items change
  useEffect(() => {
    if (formData.items.length > 0) {
      const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = subtotal * (formData.taxRate / 100);
      const total = subtotal + taxAmount;
      
      setFormData(prev => ({
        ...prev,
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total.toString()
      }));
    }
  }, [formData.items, formData.taxRate]);

  // Helper function to format date string for date inputs
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format to YYYY-MM-DD for HTML date input
    return date.toISOString().split('T')[0];
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields first
      if (!formData.clientId) {
        alert('Please select a client');
        return;
      }
      
      if (!formData.issueDate) {
        alert('Please select an issue date');
        return;
      }
      
      if (!formData.dueDate) {
        alert('Please select a due date');
        return;
      }
      
      // Validate items
      if (formData.items.length === 0) {
        alert('Please add at least one item to the invoice');
        return;
      }
      
      for (const item of formData.items) {
        if (!item.description.trim()) {
          alert('Please provide a description for all items');
          return;
        }
        if (item.quantity <= 0) {
          alert('Quantity must be greater than zero for all items');
          return;
        }
      }
      
      // Calculate subtotal from items
      const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
      
      // Calculate tax amount
      const taxRate = formData.taxRate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      
      // Calculate total
      const total = subtotal + taxAmount;
      
      // Format dates properly
      const formattedIssueDate = new Date(formData.issueDate).toISOString();
      const formattedDueDate = new Date(formData.dueDate).toISOString();
      
      // Prepare invoice data with proper numeric values
      const invoiceData = {
        clientId: formData.clientId,
        clientName: formData.clientName,
        issueDate: formattedIssueDate,
        dueDate: formattedDueDate,
        items: formData.items.map(item => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.amount),
        })),
        subtotal: Number(subtotal),
        taxRate: Number(taxRate),
        taxAmount: Number(taxAmount),
        total: Number(total),
        notes: formData.notes
      };
      
      console.log('Submitting invoice data:', invoiceData);
      
      if (editingInvoice) {
        // Edit existing invoice
        await updateInvoice(editingInvoice._id, invoiceData);
      } else {
        // Add new invoice
        await createInvoice(invoiceData);
      }
      
      // Reset form and close modal
      setShowModal(false);
      setFormData({
        clientId: '',
        clientName: '',
        total: '',
        paid: '',
        issueDate: '',
        dueDate: '',
        items: [{
          service: '',
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0
        }],
        notes: '',
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0
      });
      setEditingInvoice(null);
      
      // Refresh invoices list
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      // Display more detailed error information
      if (error.response && error.response.data) {
        alert(`Failed to save invoice: ${error.response.data.message || JSON.stringify(error.response.data.errors) || error.response.data.error || 'Unknown error'}`);
      } else {
        alert('Failed to save invoice. Please check your form and try again.');
      }
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      issueDate: formatDateForInput(invoice.issueDate),
      dueDate: formatDateForInput(invoice.dueDate),
      total: invoice.total.toString(),
      paid: invoice.paid.toString(),
      items: invoice.items.map(item => ({
        service: item.service || '',
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      })),
      notes: invoice.notes || '',
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice.');
      }
    }
  };

  const handlePaymentStatusChange = async (id: string, newStatus: Invoice['status']) => {
    try {
      await updateInvoiceStatus(id, newStatus);
    } catch (error) {
      console.error('Error changing invoice status:', error);
    }
  };

  // Add client status change handler
  const handleClientStatusChange = (id: string, newStatus: 'Viewed' | 'Not Viewed') => {
    // We don't need to implement this as it's part of the original UI but not supported by our API
    console.log('Client status change requested but not implemented:', id, newStatus);
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Partially Paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'Unpaid':
        return 'bg-red-100 text-red-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientStatusColor = (status: 'Viewed' | 'Not Viewed') => {
    switch (status) {
      case 'Viewed':
        return 'bg-green-100 text-green-800';
      case 'Not Viewed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Invoice</h1>
        <button
          onClick={() => {
            setEditingInvoice(null);
            setFormData({
              clientId: '',
              clientName: '',
              total: '',
              paid: '',
              issueDate: '',
              dueDate: '',
              items: [{
                service: '',
                description: '',
                quantity: 1,
                rate: 0,
                amount: 0
              }],
              notes: '',
              subtotal: 0,
              taxRate: 0,
              taxAmount: 0
            });
            setShowModal(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Invoice
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
                  <th className="px-4 py-2 text-left">Invoice No</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Issue Date</th>
                  <th className="px-4 py-2 text-left">Due Date</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Paid</th>
                  <th className="px-4 py-2 text-left">Due</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Client Status</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">Loading invoices...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-red-500">Error loading invoices: {error}</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">No invoices found</td>
                  </tr>
                ) : (
                  invoices
                    .filter(invoice =>
                      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((invoice) => (
                      <tr key={invoice._id} className="border-b">
                        <td className="px-4 py-2">{invoice.invoiceNo}</td>
                        <td className="px-4 py-2">{invoice.clientName}</td>
                        <td className="px-4 py-2">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          {invoice.total.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR'
                          })}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.paid.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR'
                          })}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.balanceDue.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR'
                          })}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={invoice.status}
                            onChange={(e) => handlePaymentStatusChange(invoice._id, e.target.value as Invoice['status'])}
                            className={`px-2 py-1 text-sm rounded-lg border-0 ${getStatusColor(invoice.status)}`}
                          >
                            <option value="Paid">Paid</option>
                            <option value="Partially Paid">Partially Paid</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={invoice.clientStatus}
                            onChange={(e) => handleClientStatusChange(invoice._id, e.target.value as 'Viewed' | 'Not Viewed')}
                            className={`px-2 py-1 text-sm rounded-lg border-0 ${getClientStatusColor(invoice.clientStatus)}`}
                          >
                            <option value="Viewed">Viewed</option>
                            <option value="Not Viewed">Not Viewed</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(invoice)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(invoice._id)}
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
                    ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              Showing {invoices.filter(invoice =>
                invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())
              ).length} of {invoices.length} entries
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

      {/* Add/Edit Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingInvoice ? 'Edit Invoice' : 'Add New Invoice'}
            </h2>
            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Client
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => {
                    const client = clients.find(c => c._id === e.target.value);
                    setFormData({
                      ...formData,
                      clientId: e.target.value,
                      clientName: client ? client.name : ''
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, issueDate: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
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
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Invoice Items
                </label>
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 mb-2 p-2 border rounded">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...newItems[index], description: e.target.value };
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full border rounded px-2 py-1"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Quantity"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          const qty = parseInt(e.target.value) || 0;
                          newItems[index] = { 
                            ...newItems[index], 
                            quantity: qty,
                            amount: qty * newItems[index].rate
                          };
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full border rounded px-2 py-1"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Rate"
                        min="0"
                        value={item.rate}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          const rate = parseFloat(e.target.value) || 0;
                          newItems[index] = { 
                            ...newItems[index], 
                            rate: rate,
                            amount: newItems[index].quantity * rate
                          };
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full border rounded px-2 py-1"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        readOnly
                        className="w-full border rounded px-2 py-1 bg-gray-100"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        items: [
                          ...formData.items,
                          { service: '', description: '', quantity: 1, rate: 0, amount: 0 }
                        ]
                      });
                    }}
                    className="px-3 py-1 text-sm border rounded text-blue-600 hover:bg-blue-50"
                  >
                    + Add Item
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subtotal
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => {
                      const taxRate = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, taxRate });
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tax Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total}
                    onChange={(e) =>
                      setFormData({ ...formData, total: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                ></textarea>
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
                  {editingInvoice ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoicePage;