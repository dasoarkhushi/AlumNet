import express from 'express';
import Job from '../models/Job.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Get all jobs
router.get('/', protect, async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name');
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Create job (admin only)
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const newJob = await Job.create({
      ...req.body,
      postedBy: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      data: newJob,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Update job (admin only)
router.patch('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return res.status(404).json({
        status: 'fail',
        message: 'Job not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Delete job (admin only)
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        status: 'fail',
        message: 'Job not found',
      });
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

export default router;