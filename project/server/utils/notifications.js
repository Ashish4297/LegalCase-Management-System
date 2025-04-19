import Notification from '../models/Notification.js';

/**
 * Send a notification to a client
 * @param {Object} client - Client information
 * @param {Object} lawyer - Lawyer information
 * @param {Object} settings - Notification settings
 * @returns {Promise<boolean>} Success status
 */
export const sendClientNotification = async (client, lawyer, settings) => {
  try {
    // Create welcome notification
    const notification = new Notification({
      userId: client._id,
      userType: 'Client',
      title: 'Welcome to Legal CMS',
      message: `Welcome ${client.name}! Your account has been created successfully. Your lawyer ${lawyer.name} will handle your cases.`,
      type: 'system'
    });

    await notification.save();

    // Process email notification
    if (settings?.enableEmailNotifications && client.email) {
      const emailContent = processTemplate(settings.emailTemplate, {
        clientName: client.name,
        clientEmail: client.email,
        lawyerName: lawyer.name,
        lawyerEmail: lawyer.email,
        lawyerPhone: lawyer.phone,
        lawFirm: 'Legal CMS',
        caseReference: `REF-${Date.now()}`,
        lawyerSignature: settings.lawyerSignature || lawyer.name
      });

      // TODO: Implement email sending logic
      console.log('Email notification:', emailContent);
    }

    // Process SMS notification
    if (settings?.enableSMSNotifications && client.mobile) {
      const smsContent = processTemplate(settings.smsTemplate, {
        clientName: client.name,
        lawyerName: lawyer.name,
        lawyerPhone: lawyer.phone,
        lawFirm: 'Legal CMS'
      });

      // TODO: Implement SMS sending logic
      console.log('SMS notification:', smsContent);
    }

    return true;
  } catch (error) {
    console.error('Error sending client notification:', error);
    return false;
  }
};

/**
 * Create a system notification
 * @param {string} userId - User ID
 * @param {string} userType - User type (Client/User)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @returns {Promise<Object>} Created notification
 */
export const createSystemNotification = async (userId, userType, title, message) => {
  try {
    const notification = new Notification({
      userId,
      userType,
      title,
      message,
      type: 'system'
    });

    return await notification.save();
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

/**
 * Process a template by replacing variables
 * @param {string} template - Template string
 * @param {Object} variables - Variables to replace
 * @returns {string} Processed template
 */
const processTemplate = (template, variables) => {
  let processed = template;
  Object.entries(variables).forEach(([key, value]) => {
    processed = processed.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return processed;
};

/**
 * Get unread notifications count
 * @param {string} userId - User ID
 * @param {string} userType - User type (Client/User)
 * @returns {Promise<number>} Unread count
 */
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