import express from 'express';
import mongoose from 'mongoose';
import Client from '../models/Client.js';
import { auth } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { sendClientNotification } from '../utils/notifications.js';

const router = express.Router();

// Get all clients with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status !== undefined) {
      query.status = status === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query)
      .populate('cases')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Client.countDocuments(query);

    return successResponse(res, {
      clients,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return errorResponse(res, 'Error fetching clients', 500);
  }
});

// Get client status by ID (Fixed route issue & added ID validation)
router.get('/status/:id', auth, async (req, res) => {
  console.log(`Received request for client status. ID: ${req.params.id}`);

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 'Invalid Client ID', 400);
  }

  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }
    return successResponse(res, {
      isApproved: client.status,
      status: client.status ? 'active' : 'inactive'
    });
  } catch (error) {
    console.error("Error fetching client status:", error);
    return errorResponse(res, 'Error fetching client status', 500);
  }
});

// Get client by ID
router.get('/:id', auth, async (req, res) => {
  console.log(`Fetching client details for ID: ${req.params.id}`);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 'Invalid Client ID', 400);
  }

  try {
    const client = await Client.findById(req.params.id)
      .populate('cases')
      .populate('createdBy', 'name email');

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    return successResponse(res, client);
  } catch (error) {
    console.error("Error fetching client details:", error);
    return errorResponse(res, 'Error fetching client details', 500);
  }
});

// Create new client
router.post('/', auth, async (req, res) => {
  try {
    const newClient = new Client({
      ...req.body,
      createdBy: req.user.userId
    });

    await newClient.save();

    // Send welcome notification if enabled
    const notificationSettings = req.body.notificationSettings;
    if (notificationSettings) {
      const lawyer = {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      };

      await sendClientNotification(newClient, lawyer, notificationSettings);
    }

    return successResponse(res, newClient, 'Client created successfully', 201);
  } catch (error) {
    console.error("Error creating client:", error);

    if (error.code === 11000) {
      return errorResponse(res, 'Email already exists', 409);
    }
    return errorResponse(res, 'Error creating client', 400);
  }
});

// Update client
router.put('/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 'Invalid Client ID', 400);
  }

  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    Object.assign(client, req.body);
    await client.save();

    return successResponse(res, client, 'Client updated successfully');
  } catch (error) {
    console.error("Error updating client:", error);

    if (error.code === 11000) {
      return errorResponse(res, 'Email already exists', 409);
    }
    return errorResponse(res, 'Error updating client', 400);
  }
});

// Delete client (with option for soft or hard delete)
router.delete('/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 'Invalid Client ID', 400);
  }

  // Check if this is a soft delete request
  const softDelete = req.query.soft === 'true';

  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    if (softDelete) {
      // Soft delete - just mark the client as inactive
      client.status = false;
      await client.save();
      return successResponse(res, null, 'Client deactivated successfully');
    } else {
      // Hard delete - check for related records first
      // Check if client has related cases
      if (client.cases && client.cases.length > 0) {
        return errorResponse(
          res, 
          'Cannot delete client with active cases. Please remove or reassign all cases first.', 
          409
        );
      }

      // Import models for checking relationships
      const Case = mongoose.model('Case');
      const Invoice = mongoose.model('Invoice');
      const Appointment = mongoose.model('Appointment');

      // Check if there are any related records
      const relatedCasesCount = await Case.countDocuments({ clientId: req.params.id });
      if (relatedCasesCount > 0) {
        return errorResponse(
          res,
          `Cannot delete client with ${relatedCasesCount} related cases. Please remove or reassign all cases first.`,
          409
        );
      }

      const relatedInvoicesCount = await Invoice.countDocuments({ clientId: req.params.id });
      if (relatedInvoicesCount > 0) {
        return errorResponse(
          res,
          `Cannot delete client with ${relatedInvoicesCount} related invoices. Please remove all invoices first.`,
          409
        );
      }

      const relatedAppointmentsCount = await Appointment.countDocuments({ clientId: req.params.id });
      if (relatedAppointmentsCount > 0) {
        return errorResponse(
          res,
          `Cannot delete client with ${relatedAppointmentsCount} related appointments. Please remove all appointments first.`,
          409
        );
      }

      // Delete the client from the database
      await Client.findByIdAndDelete(req.params.id);
      console.log(`Client with ID ${req.params.id} successfully deleted from database`);

      return successResponse(res, null, 'Client deleted successfully');
    }
  } catch (error) {
    console.error("Error deleting client:", error);
    return errorResponse(res, 'Error deleting client', 400);
  }
});

export default router;
