import express from 'express';
import Invoice from '../models/Invoice.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all invoices
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /invoices request from user:', req.user?.userId);
    
    // Try to find invoices without populate first to isolate any potential issues
    let invoices;
    try {
      invoices = await Invoice.find();
      console.log(`Found ${invoices.length} invoices without populate`);
      
      // Now attempt to populate if basic query worked
      invoices = await Invoice.find()
        .populate('clientId')
        .populate('items.service');
      
      console.log(`Successfully populated ${invoices.length} invoices`);
    } catch (dbError) {
      console.error('Database error in GET /invoices:', dbError);
      return res.status(500).json({ 
        message: 'Database error fetching invoices', 
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined 
      });
    }
    
    res.json(invoices);
  } catch (error) {
    console.error('General error in GET /invoices:', error);
    res.status(500).json({ 
      message: 'Error fetching invoices', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get a single invoice by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('clientId')
      .populate('items.service')
      .populate('createdBy', 'name email');
      
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
});

// Get invoices by client ID
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ clientId: req.params.clientId })
      .populate('items.service')
      .sort({ issueDate: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client invoices', error: error.message });
  }
});

// Create new invoice
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating invoice: Request body:', req.body);
    
    // Validate incoming data
    if (!req.body.clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }
    
    if (!req.body.clientName) {
      return res.status(400).json({ message: 'Client name is required' });
    }
    
    // Validate dates
    try {
      const issueDate = new Date(req.body.issueDate);
      const dueDate = new Date(req.body.dueDate);
      
      if (isNaN(issueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid issue date format' });
      }
      
      if (isNaN(dueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid due date format' });
      }
      
      // Make sure we use the validated Date objects
      req.body.issueDate = issueDate;
      req.body.dueDate = dueDate;
    } catch (dateError) {
      return res.status(400).json({ message: 'Error processing dates', error: dateError.message });
    }
    
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ message: 'At least one invoice item is required' });
    }
    
    for (const item of req.body.items) {
      if (!item.description) {
        return res.status(400).json({ message: 'Item description is required' });
      }
      if (isNaN(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ message: 'Item quantity must be a positive number' });
      }
      if (isNaN(item.rate) || item.rate < 0) {
        return res.status(400).json({ message: 'Item rate must be a non-negative number' });
      }
      if (isNaN(item.amount) || item.amount < 0) {
        return res.status(400).json({ message: 'Item amount must be a non-negative number' });
      }
    }
    
    if (isNaN(req.body.subtotal) || req.body.subtotal < 0) {
      return res.status(400).json({ message: 'Subtotal must be a non-negative number' });
    }
    
    if (isNaN(req.body.total) || req.body.total < 0) {
      return res.status(400).json({ message: 'Total must be a non-negative number' });
    }
    
    // Generate invoice number based on count + prefix
    const count = await Invoice.countDocuments();
    const invoiceNo = `INV-${String(count + 1).padStart(6, '0')}`;
    
    // Create invoice object with clean data
    const newInvoiceData = {
      invoiceNo,
      clientId: req.body.clientId,
      clientName: req.body.clientName,
      issueDate: req.body.issueDate,
      dueDate: req.body.dueDate,
      items: req.body.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount)
      })),
      subtotal: Number(req.body.subtotal),
      taxRate: Number(req.body.taxRate || 0),
      taxAmount: Number(req.body.taxAmount || 0),
      total: Number(req.body.total),
      notes: req.body.notes,
      createdBy: req.user.userId
    };
    
    console.log('Creating new invoice with data:', newInvoiceData);
    
    const newInvoice = new Invoice(newInvoiceData);
    
    const savedInvoice = await newInvoice.save();
    console.log('Invoice created successfully:', savedInvoice._id);
    res.status(201).json(savedInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: `Invalid ${error.path}: ${error.value}` 
      });
    }
    
    res.status(400).json({ 
      message: 'Error creating invoice', 
      error: error.message 
    });
  }
});

// Update invoice
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: 'Error updating invoice', error: error.message });
  }
});

// Delete invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting invoice', error: error.message });
  }
});

// Update invoice status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: 'Error updating invoice status', error: error.message });
  }
});

// Mark invoice as viewed by client
router.patch('/:id/mark-viewed', auth, async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { clientStatus: 'Viewed' },
      { new: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: 'Error marking invoice as viewed', error: error.message });
  }
});

// Record payment on invoice
router.post('/:id/payments', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const newPaidAmount = invoice.paid + parseFloat(amount);
    
    // Determine new status based on payment
    let status;
    if (newPaidAmount >= invoice.total) {
      status = 'Paid';
    } else if (newPaidAmount > 0) {
      status = 'Partially Paid';
    } else {
      status = 'Unpaid';
    }
    
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { 
        paid: newPaidAmount,
        status
      },
      { new: true }
    );
    
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: 'Error recording payment', error: error.message });
  }
});

export default router; 