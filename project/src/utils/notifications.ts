import { NotificationSettings } from '../types';

export const sendClientNotification = async (
  client: {
    name: string;
    email: string;
    phone: string;
  },
  lawyer: {
    name: string;
    email: string;
    phone: string;
  },
  settings: NotificationSettings
) => {
  const variables = {
    clientName: client.name,
    clientEmail: client.email,
    lawyerName: lawyer.name,
    lawyerEmail: lawyer.email,
    lawyerPhone: lawyer.phone,
    lawFirm: 'Your Law Firm Name',
    caseReference: `REF-${Date.now()}`,
    lawyerSignature: settings.lawyerSignature
  };

  // Replace template variables
  const processTemplate = (template: string) => {
    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return processed;
  };

  try {
    // Send email notification
    if (settings.enableEmailNotifications && client.email) {
      const emailContent = processTemplate(settings.emailTemplate);
      // Implement your email sending logic here
      console.log('Sending email to:', client.email, emailContent);
    }

    // Send SMS notification
    if (settings.enableSMSNotifications && client.phone) {
      const smsContent = processTemplate(settings.smsTemplate);
      // Implement your SMS sending logic here
      console.log('Sending SMS to:', client.phone, smsContent);
    }

    return true;
  } catch (error) {
    console.error('Error sending notifications:', error);
    return false;
  }
};