import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  userType,
  title,
  message,
  type,
  referenceId,
  referenceModel
}) => {
  try {
    const notification = new Notification({
      userId,
      userType,
      title,
      message,
      type,
      referenceId,
      referenceModel
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const createSystemNotification = async ({
  userId,
  userType,
  title,
  message
}) => {
  try {
    const notification = new Notification({
      userId,
      userType,
      title,
      message,
      type: 'system'
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

export const getUnreadCount = async (userId, userType) => {
  try {
    return await Notification.countDocuments({
      userId,
      userType,
      isRead: false
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};