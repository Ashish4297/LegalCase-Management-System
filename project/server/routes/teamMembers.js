import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import TeamMember from '../models/TeamMember.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Setup multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    try {
      const uploadDir = path.join(process.cwd(), 'public/uploads/profile-images');
      
      // Create directory structure if it doesn't exist
      if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
        fs.mkdirSync(path.join(process.cwd(), 'public'), { recursive: true });
      }
      
      if (!fs.existsSync(path.join(process.cwd(), 'public/uploads'))) {
        fs.mkdirSync(path.join(process.cwd(), 'public/uploads'), { recursive: true });
      }
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Test write permissions by creating and immediately removing a test file
      const testFilePath = path.join(uploadDir, `.test-${Date.now()}.txt`);
      try {
        fs.writeFileSync(testFilePath, 'test');
        fs.unlinkSync(testFilePath);
      } catch (writeErr) {
        console.error('Directory permission error:', writeErr);
        return cb(new Error('Cannot write to upload directory - permission denied'), null);
      }
      
      cb(null, uploadDir);
    } catch (dirErr) {
      console.error('Directory creation error:', dirErr);
      cb(dirErr, null);
    }
  },
  filename: function(req, file, cb) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'profile-' + uniqueSuffix + ext);
    } catch (err) {
      console.error('Filename generation error:', err);
      cb(err, null);
    }
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG and GIF files are allowed'), false);
  }
};

// Create uploader with better error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
}).single('profileImage');

// Get all team members
router.get('/', auth, async (req, res) => {
  try {
    const teamMembers = await TeamMember.find();
    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team members', error: error.message });
  }
});

// Get a single team member by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    res.json(teamMember);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team member', error: error.message });
  }
});

// Create new team member with profile image upload - with better error handling
router.post('/', auth, (req, res) => {
  // Use upload middleware with explicit error handling
  upload(req, res, async function(uploadError) {
    try {
      if (uploadError) {
        console.error('Multer upload error:', uploadError);
        return res.status(400).json({ 
          message: 'File upload error', 
          error: uploadError.message 
        });
      }
      
      // Debug: Log the entire request body
      console.log('TeamMember POST request body:', JSON.stringify(req.body, null, 2));
      console.log('TeamMember POST file:', req.file);
      
      const teamMemberData = req.body;
      
      // Validate required fields
      const requiredFields = ['name', 'email', 'position', 'role'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (!teamMemberData[field]) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        return res.status(400).json({ 
          message: `Error creating team member: ${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required` 
        });
      }

      // Validate role
      const validRoles = ['Admin', 'Attorney', 'Paralegal', 'Assistant', 'Other'];
      if (!validRoles.includes(teamMemberData.role)) {
        console.error('Invalid role:', teamMemberData.role);
        return res.status(400).json({ 
          message: `Error creating team member: role must be one of ${validRoles.join(', ')}` 
        });
      }

      // Validate status if provided
      if (teamMemberData.status) {
        const validStatuses = ['Active', 'Inactive', 'On Leave'];
        if (!validStatuses.includes(teamMemberData.status)) {
          console.error('Invalid status:', teamMemberData.status);
          return res.status(400).json({ 
            message: `Error creating team member: status must be one of ${validStatuses.join(', ')}` 
          });
        }
      }
      
      // Parse specializations if it's a JSON string
      if (typeof teamMemberData.specializations === 'string') {
        try {
          if (teamMemberData.specializations.startsWith('[')) {
            teamMemberData.specializations = JSON.parse(teamMemberData.specializations);
            console.log('Parsed specializations from JSON:', teamMemberData.specializations);
          } else {
            // If it's a comma-separated string, split it
            teamMemberData.specializations = teamMemberData.specializations
              .split(',')
              .map(s => s.trim())
              .filter(s => s);
            console.log('Parsed specializations from comma-separated string:', teamMemberData.specializations);
          }
        } catch (e) {
          console.error('Error parsing specializations:', e);
          teamMemberData.specializations = [];
        }
      } else if (!teamMemberData.specializations) {
        teamMemberData.specializations = [];
      }
      
      // Add profile image URL if a file was uploaded
      if (req.file) {
        teamMemberData.profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
      }
      
      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(teamMemberData.email)) {
        console.error('Invalid email format:', teamMemberData.email);
        return res.status(400).json({ 
          message: 'Please enter a valid email address'
        });
      }
      
      // Validate dateJoined if present
      if (teamMemberData.dateJoined) {
        try {
          const date = new Date(teamMemberData.dateJoined);
          if (isNaN(date.getTime())) {
            console.error('Invalid date format for dateJoined:', teamMemberData.dateJoined);
            return res.status(400).json({ 
              message: 'Invalid date format for date joined'
            });
          }
          // Convert to proper date object
          teamMemberData.dateJoined = date;
        } catch (err) {
          console.error('Error parsing dateJoined:', err);
          return res.status(400).json({ 
            message: 'Invalid date format for date joined'
          });
        }
      }
      
      console.log('Creating team member with data:', JSON.stringify(teamMemberData, null, 2));
      
      const newTeamMember = new TeamMember(teamMemberData);
      await newTeamMember.save();
      console.log('Team member created successfully:', newTeamMember._id);
      res.status(201).json(newTeamMember);
    } catch (error) {
      console.error('Team member creation error:', error);
      
      // Handle duplicate email error
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'Email address is already in use by another team member'
        });
      }
      
      // Handle MongoDB validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        console.error('Validation errors:', validationErrors);
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationErrors,
          error: validationErrors.join(', ')
        });
      }
      
      res.status(400).json({ 
        message: 'Error creating team member', 
        error: error.message || 'Unknown error'
      });
    }
  });
});

// Update team member with better error handling
router.put('/:id', auth, (req, res) => {
  // Use upload middleware with explicit error handling
  upload(req, res, async function(uploadError) {
    try {
      if (uploadError) {
        console.error('Multer upload error:', uploadError);
        return res.status(400).json({ 
          message: 'File upload error', 
          error: uploadError.message 
        });
      }
      
      const teamMemberData = req.body;
      
      // Validate ID
      if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid team member ID format' });
      }
      
      // Validate role if provided
      if (teamMemberData.role) {
        const validRoles = ['Admin', 'Attorney', 'Paralegal', 'Assistant', 'Other'];
        if (!validRoles.includes(teamMemberData.role)) {
          return res.status(400).json({ 
            message: `Error updating team member: role must be one of ${validRoles.join(', ')}` 
          });
        }
      }

      // Validate status if provided
      if (teamMemberData.status) {
        const validStatuses = ['Active', 'Inactive', 'On Leave'];
        if (!validStatuses.includes(teamMemberData.status)) {
          return res.status(400).json({ 
            message: `Error updating team member: status must be one of ${validStatuses.join(', ')}` 
          });
        }
      }
      
      // Parse specializations if it's a JSON string
      if (typeof teamMemberData.specializations === 'string') {
        try {
          if (teamMemberData.specializations.startsWith('[')) {
            teamMemberData.specializations = JSON.parse(teamMemberData.specializations);
          } else {
            // If it's a comma-separated string, split it
            teamMemberData.specializations = teamMemberData.specializations
              .split(',')
              .map(s => s.trim())
              .filter(s => s);
          }
        } catch (e) {
          console.error('Error parsing specializations:', e);
          // Don't update specializations if we can't parse them
          delete teamMemberData.specializations;
        }
      }
      
      // Add profile image URL if a file was uploaded
      if (req.file) {
        // If there's an existing image, delete it
        const existingTeamMember = await TeamMember.findById(req.params.id);
        if (existingTeamMember && existingTeamMember.profileImageUrl) {
          const existingImagePath = path.join(process.cwd(), 'public', existingTeamMember.profileImageUrl);
          if (fs.existsSync(existingImagePath)) {
            try {
              fs.unlinkSync(existingImagePath);
            } catch (err) {
              console.error('Error deleting existing image:', err);
              // Continue even if image deletion fails
            }
          }
        }
        
        teamMemberData.profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
      }
      
      const updatedTeamMember = await TeamMember.findByIdAndUpdate(
        req.params.id,
        teamMemberData,
        { new: true, runValidators: true }
      );
      
      if (!updatedTeamMember) {
        return res.status(404).json({ message: 'Team member not found' });
      }
      
      res.json(updatedTeamMember);
    } catch (error) {
      console.error('Team member update error:', error);
      
      // Handle duplicate email error
      if (error.code === 11000) {
        return res.status(400).json({ 
          message: 'Email address is already in use by another team member'
        });
      }
      
      res.status(400).json({ 
        message: 'Error updating team member', 
        error: error.message || 'Unknown error'
      });
    }
  });
});

// Delete team member
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find the team member first to get the image path
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // Delete associated profile image if exists
    if (teamMember.profileImageUrl) {
      const imagePath = path.join(process.cwd(), 'public', teamMember.profileImageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete the team member
    await TeamMember.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting team member', error: error.message });
  }
});

// Get team members by role
router.get('/role/:role', auth, async (req, res) => {
  try {
    const teamMembers = await TeamMember.find({ role: req.params.role });
    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team members by role', error: error.message });
  }
});

export default router; 