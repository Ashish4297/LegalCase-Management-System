import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Client from '../models/Client.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role,
      phone
    });

    await user.save();

    // If registering as a client, create a client record
    if (role === 'client') {
      const client = new Client({
        name,
        email,
        mobile: phone,
        status: true, // Set initial status as active
        createdBy: user._id
      });
      await client.save();
      
      // Update user with client reference
      user.clientId = client._id;
      await user.save();
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        clientId: user.clientId // Include clientId in token if it exists
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If user is a client, check client status
    if (user.role === 'client') {
      const client = await Client.findOne({ email: user.email });
      if (!client) {
        return res.status(400).json({ message: 'Client account not found' });
      }
      if (!client.status) {
        return res.status(403).json({ message: 'Your account is currently inactive. Please contact support.' });
      }
      user.clientId = client._id;
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        clientId: user.clientId // Include clientId in token if it exists
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});

// Get current user
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Verify token
router.get('/verify', auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

export default router;