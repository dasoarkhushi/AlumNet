import express from 'express';
import User from '../models/User.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Update user profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        graduationYear: req.body.graduationYear,
        degree: req.body.degree,
        major: req.body.major,
        currentPosition: req.body.currentPosition,
        company: req.body.company,
        bio: req.body.bio,
        profileImage: req.body.profileImage,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Search users
router.get('/search', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.graduationYear) {
      query.graduationYear = req.query.graduationYear;
    }
    if (req.query.major) {
      query.major = { $regex: req.query.major, $options: 'i' };
    }

    const users = await User.find(query);
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

export default router;