import express from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      userId: req.user.userId,
      userType: req.user.role === 'client' ? 'Client' : 'User'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Notification.countDocuments({
      userId: req.user.userId,
      userType: req.user.role === 'client' ? 'Client' : 'User'
    });

    const unreadCount = await Notification.countDocuments({
      userId: req.user.userId,
      userType: req.user.role === 'client' ? 'Client' : 'User',
      isRead: false
    });

    res.json({
      notifications,
      total,
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Error fetching notifications',
      error: error.message 
    });
  }
});

// Create a new notification
router.post('/', auth, async (req, res) => {
  try {
    const { title, message, type, referenceId, referenceModel } = req.body;

    const notification = new Notification({
      userId: req.user.userId,
      userType: req.user.role === 'client' ? 'Client' : 'User',
      title,
      message,
      type,
      referenceId,
      referenceModel
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      message: 'Error creating notification',
      error: error.message 
    });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id,
        userId: req.user.userId
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ 
      message: 'Error updating notification',
      error: error.message 
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { 
        userId: req.user.userId,
        userType: req.user.role === 'client' ? 'Client' : 'User',
        isRead: false
      },
      { isRead: true }
    );

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ 
      message: 'Error updating notifications',
      error: error.message 
    });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      message: 'Error deleting notification',
      error: error.message 
    });
  }
});

// Delete all read notifications
router.delete('/clear/read', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.userId,
      userType: req.user.role === 'client' ? 'Client' : 'User',
      isRead: true
    });

    res.json({ 
      message: 'All read notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ 
      message: 'Error deleting notifications',
      error: error.message 
    });
  }
});

export default router;