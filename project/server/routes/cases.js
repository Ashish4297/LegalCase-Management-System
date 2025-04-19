import express from 'express';
import Case from '../models/Case.js';
import { auth } from '../middleware/auth.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse 
} from '../utils/apiResponse.js';
import mongoose from 'mongoose';

const router = express.Router();

// Validate case data
const validateCaseData = (data) => {
  const errors = {};

  if (!data.clientName?.trim()) {
    errors.clientName = 'Client name is required';
  }
  if (!data.clientNo?.trim()) {
    errors.clientNo = 'Client number is required';
  }
  if (!data.caseType?.trim()) {
    errors.caseType = 'Case type is required';
  }
  if (!data.court?.trim()) {
    errors.court = 'Court is required';
  }
  if (!data.petitioner?.trim()) {
    errors.petitioner = 'Petitioner is required';
  }
  if (!data.respondent?.trim()) {
    errors.respondent = 'Respondent is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Get all cases with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      isImportant,
      isArchived,
      search,
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Build filter query
    if (status) query.status = status;
    if (isImportant !== undefined) query.isImportant = isImportant === 'true';
    if (isArchived !== undefined) query.isArchived = isArchived === 'true';
    
    // Date range filter
    if (startDate || endDate) {
      query.nextDate = {};
      if (startDate) query.nextDate.$gte = new Date(startDate);
      if (endDate) query.nextDate.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { clientNo: { $regex: search, $options: 'i' } },
        { caseType: { $regex: search, $options: 'i' } }
      ];
    }

    const cases = await Case.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Case.countDocuments(query);

    return successResponse(res, {
      cases,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return errorResponse(res, 'Error fetching cases', 500);
  }
});

// Get case by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('appointments')
      .populate('documents.uploadedBy', 'name email')
      .populate('timeline.addedBy', 'name email')
      .populate('notes.createdBy', 'name email');

    if (!caseData) {
      return notFoundResponse(res, 'Case not found');
    }

    return successResponse(res, caseData);
  } catch (error) {
    return errorResponse(res, 'Error fetching case details', 500);
  }
});

// Create new case
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new case with data:', JSON.stringify(req.body, null, 2));
    console.log('User in request:', JSON.stringify(req.user, null, 2));
    
    const errors = validateCaseData(req.body);
    if (errors) {
      console.log('Validation errors:', errors);
      return validationErrorResponse(res, errors);
    }

    // Create case document with required fields
    const newCase = new Case({
      ...req.body,
      createdBy: req.user.userId,
      assignedTo: req.body.assignedTo || req.user.userId
    });

    console.log('New case instance created:', newCase);

    // Save without a session (no transaction)
    await newCase.save();
    console.log('Case saved successfully');

    // Add initial timeline entry
    newCase.timeline.push({
      date: new Date(),
      description: 'Case created',
      addedBy: req.user.userId
    });

    // Save the updated case with timeline
    await newCase.save();
    console.log('Timeline added successfully');

    return successResponse(res, newCase, 'Case created successfully', 201);
  } catch (error) {
    console.error('Error creating case:', error.message, error.stack);
    return errorResponse(res, `Error creating case: ${error.message}`, 400);
  }
});

// Create new case without using a session (simpler approach for troubleshooting)
router.post('/simple', auth, async (req, res) => {
  try {
    console.log('Creating simple case with data:', JSON.stringify(req.body, null, 2));
    console.log('User in request:', JSON.stringify(req.user, null, 2));
    
    const errors = validateCaseData(req.body);
    if (errors) {
      console.log('Validation errors:', errors);
      return validationErrorResponse(res, errors);
    }

    // Create case document with required fields
    const newCase = new Case({
      ...req.body,
      createdBy: req.user.userId,
      assignedTo: req.body.assignedTo || req.user.userId
    });

    console.log('Simple case instance created:', newCase);

    // Save without a session
    await newCase.save();
    console.log('Simple case saved successfully');

    // Add timeline entry
    newCase.timeline = [{
      date: new Date(),
      description: 'Case created',
      addedBy: req.user.userId
    }];

    await newCase.save();
    console.log('Simple case timeline added');

    return successResponse(res, newCase, 'Case created successfully', 201);
  } catch (error) {
    console.error('Error creating simple case:', error.message, error.stack);
    return errorResponse(res, `Error creating case: ${error.message}`, 400);
  }
});

// Create new case with direct approach - absolute last resort for troubleshooting
router.post('/direct', auth, async (req, res) => {
  try {
    console.log('Creating direct case with data:', JSON.stringify(req.body, null, 2));
    console.log('User in request:', JSON.stringify(req.user, null, 2));
    
    // Skip validation for direct testing
    
    // Create minimal document with just the required fields
    const directCase = {
      clientNo: req.body.clientNo || `DIRECT-${Date.now()}`,
      clientName: req.body.clientName || 'Direct Test',
      caseType: req.body.caseType || 'Test Case',
      court: req.body.court || 'Test Court',
      petitioner: req.body.petitioner || 'Test Pet',
      respondent: req.body.respondent || 'Test Resp',
      status: 'Pending',
      isImportant: false,
      isArchived: false,
      // Critical fields
      createdBy: req.user.userId,
      assignedTo: req.body.assignedTo || req.user.userId,
      // Add empty timeline to avoid validation errors
      timeline: [{
        date: new Date(),
        description: 'Case created directly',
        addedBy: req.user.userId
      }]
    };

    console.log('Direct case to save:', directCase);

    // Use direct model creation without any middleware
    const result = await Case.create(directCase);
    console.log('Direct case creation result:', result);

    return successResponse(res, result, 'Case created directly', 201);
  } catch (error) {
    console.error('Error creating direct case:', error.message, error.stack);
    return errorResponse(res, `Direct case creation failed: ${error.message}`, 400);
  }
});

// Update case
router.put('/:id', auth, async (req, res) => {
  try {
    const { timeline, notes, ...updateData } = req.body;
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return notFoundResponse(res, 'Case not found');
    }

    // Update basic case information
    Object.assign(caseData, updateData);

    // Add new timeline entry if provided
    if (timeline) {
      caseData.timeline.push({
        ...timeline,
        addedBy: req.user.userId,
        date: new Date()
      });
    }

    // Add new note if provided
    if (notes) {
      caseData.notes.push({
        ...notes,
        createdBy: req.user.userId,
        createdAt: new Date()
      });
    }

    await caseData.save();
    return successResponse(res, caseData, 'Case updated successfully');
  } catch (error) {
    return errorResponse(res, 'Error updating case', 400);
  }
});

// Add document to case
router.post('/:id/documents', auth, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return notFoundResponse(res, 'Case not found');
    }

    caseData.documents.push({
      ...req.body,
      uploadedBy: req.user.userId,
      uploadedAt: new Date()
    });

    await caseData.save();
    return successResponse(res, caseData, 'Document added successfully');
  } catch (error) {
    return errorResponse(res, 'Error adding document', 400);
  }
});

// Delete case (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return notFoundResponse(res, 'Case not found');
    }

    caseData.isArchived = true;
    await caseData.save();

    return successResponse(res, null, 'Case archived successfully');
  } catch (error) {
    return errorResponse(res, 'Error archiving case', 400);
  }
});

export default router;