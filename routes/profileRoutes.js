import express from 'express';
import jwt from 'jsonwebtoken';
import Profile from '../models/Profile.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Middleware to verify and extract user information
const extractUserFromToken = (req) => {
  const token = req.cookies.jwt;
  if (!token) throw new Error('Not authenticated');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.id;
};

// Fetch user profile
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId });
    console.log('Looking for profile with userId:', userId);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.patch('/', protect, async (req, res) => {
  console.log('Received data:', req.body); 
  try {
    const userId = req.user.id;
    const updatedData = req.body;

    const profile = await Profile.findOneAndUpdate(
        { user: userId }, // Find by user ID
        { $set: updatedData }, // Apply changes
        { new: true, runValidators: true } // Create if not exists
      );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    res.status(400).json({ message: 'Error updating profile', error: error.message });
  }
});

export default router;