import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import clientRoutes from './routes/clients.js';
import serviceRoutes from './routes/services.js';
import notificationRoutes from './routes/notifications.js';
import teamMemberRoutes from './routes/teamMembers.js';
import invoiceRoutes from './routes/invoices.js';
import taskRoutes from './routes/tasks.js';
import appointmentRoutes from './routes/appointments.js';

dotenv.config();

// Initialize __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Root route handler
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Legal Case Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      cases: '/api/cases',
      clients: '/api/clients',
      services: '/api/services',
      notifications: '/api/notifications',
      teamMembers: '/api/team-members',
      invoices: '/api/invoices',
      tasks: '/api/tasks',
      appointments: '/api/appointments'
    }
  });
});

// API Routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// MongoDB Connection with retry logic
const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log('Connecting to MongoDB:', MONGODB_URI);
      await mongoose.connect(MONGODB_URI);
      
      // Test if sessions are supported
      try {
        const session = await mongoose.startSession();
        console.log('MongoDB session support: YES');
        session.endSession();
      } catch (sessionErr) {
        console.error('MongoDB session support: NO', sessionErr.message);
        console.warn('Warning: MongoDB sessions not available, transactions will fail');
      }
      
      console.log('MongoDB Connected Successfully');
      return;
    } catch (err) {
      if (i === retries - 1) {
        console.error('MongoDB connection failed after retries:', err);
        process.exit(1);
      }
      console.log(`Connection attempt ${i + 1} failed. Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Start server with error handling
const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('\nAPI endpoints:');
      console.log('- GET    /');
      console.log('- GET    /health');
      console.log('- GET    /api/auth/user');
      console.log('- POST   /api/auth/login');
      console.log('- POST   /api/auth/register');
      console.log('- GET    /api/cases');
      console.log('- GET    /api/clients');
      console.log('- GET    /api/services');
      console.log('- GET    /api/notifications');
      console.log('- GET    /api/team-members');
      console.log('- GET    /api/invoices');
      console.log('- GET    /api/tasks');
      console.log('- GET    /api/appointments');
      
      console.log('\nTeam Members Endpoints:');
      console.log('- GET    /api/team-members                # Get all team members');
      console.log('- GET    /api/team-members/:id            # Get team member by ID');
      console.log('- POST   /api/team-members                # Create new team member');
      console.log('- PUT    /api/team-members/:id            # Update team member');
      console.log('- DELETE /api/team-members/:id            # Delete team member');
      console.log('- GET    /api/team-members/role/:role     # Get team members by role');
      
      console.log('\nInvoices Endpoints:');
      console.log('- GET    /api/invoices                    # Get all invoices');
      console.log('- GET    /api/invoices/:id                # Get invoice by ID');
      console.log('- GET    /api/invoices/client/:clientId   # Get invoices by client');
      console.log('- POST   /api/invoices                    # Create new invoice');
      console.log('- PUT    /api/invoices/:id                # Update invoice');
      console.log('- DELETE /api/invoices/:id                # Delete invoice');
      console.log('- PATCH  /api/invoices/:id/status         # Update invoice status');
      console.log('- PATCH  /api/invoices/:id/mark-viewed    # Mark invoice as viewed');
      console.log('- POST   /api/invoices/:id/payments       # Record payment on invoice');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't exit the process in production, just log the error
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process in production, just log the error
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

startServer();