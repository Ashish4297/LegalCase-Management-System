import express from 'express';
import Task from '../models/Task.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    // Debugging
    console.log('\n--- TASK CREATION ATTEMPT ---');
    console.log('Creating task with data:', JSON.stringify(req.body, null, 2));
    console.log('Auth user object:', JSON.stringify(req.user, null, 2));
    
    // Check if user is authenticated properly
    if (!req.user || !req.user.userId) {
      console.log('Authentication error: Missing userId in token');
      return res.status(400).json({ 
        message: 'User ID not found in token',
        details: 'Authentication token does not contain user ID'
      });
    }
    
    console.log('User authenticated with ID:', req.user.userId);
    
    // Validate required fields
    if (!req.body.title) {
      console.log('Validation error: Missing title');
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!req.body.dueDate) {
      console.log('Validation error: Missing dueDate');
      return res.status(400).json({ message: 'Due date is required' });
    }
    
    try {
      // Check if dueDate is a valid date
      const dueDate = new Date(req.body.dueDate);
      if (isNaN(dueDate.getTime())) {
        console.log('Validation error: Invalid date format for dueDate', req.body.dueDate);
        return res.status(400).json({ message: 'Due date is in invalid format' });
      }
      
      console.log('Due date validation passed:', dueDate.toISOString());
    } catch (dateError) {
      console.log('Date parsing error:', dateError);
      return res.status(400).json({ message: 'Due date could not be parsed' });
    }
    
    // Create new task with validated data
    const task = new Task({
      title: req.body.title,
      description: req.body.description || '',
      dueDate: req.body.dueDate,
      status: req.body.status || 'Pending',
      priority: req.body.priority || 'Medium',
      userId: req.user.userId,
      relatedTo: req.body.relatedTo || { name: '', caseNumber: '' }
    });
    
    console.log('Saving task:', JSON.stringify(task, null, 2));
    try {
      await task.save();
      console.log('Task saved successfully with ID:', task._id);
      res.status(201).json(task);
    } catch (saveError) {
      console.error('MongoDB save error:', saveError);
      return res.status(400).json({ 
        message: 'Error saving task to database', 
        error: saveError.message,
        code: saveError.code,
        details: saveError.errors ? Object.keys(saveError.errors).map(key => `${key}: ${saveError.errors[key].message}`).join(', ') : undefined
      });
    }
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ 
      message: 'Error creating task', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    // Find task and verify ownership
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user owns the task
    if (task.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error: error.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find task and verify ownership
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user owns the task
    if (task.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting task', error: error.message });
  }
});

// Toggle task completion
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    // Find task and verify ownership
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user owns the task
    if (task.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to modify this task' });
    }
    
    task.completed = !task.completed;
    task.status = task.completed ? 'Completed' : 'In Progress';
    await task.save();
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error toggling task', error: error.message });
  }
});

export default router; 