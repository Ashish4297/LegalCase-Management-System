import express from 'express';
import Service from '../models/Service.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all services
router.get('/', auth, async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// Create new service
router.post('/', auth, async (req, res) => {
  try {
    const newService = new Service(req.body);
    await newService.save();
    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ message: 'Error creating service', error: error.message });
  }
});

// Update service
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(updatedService);
  } catch (error) {
    res.status(400).json({ message: 'Error updating service', error: error.message });
  }
});

// Delete service
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting service', error: error.message });
  }
});

export default router;