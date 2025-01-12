import express from 'express';
import Event from '../models/Event.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Get all events
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name')
      .populate('attendees', 'name');
    
    res.status(200).json({
      status: 'success',
      results: events.length,
      data: events,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Create event (admin only)
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const newEvent = await Event.create({
      ...req.body,
      organizer: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      data: newEvent,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Register for event
router.post('/:id/register', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found',
      });
    }

    if (event.attendees.includes(req.user.id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already registered for this event',
      });
    }

    event.attendees.push(req.user.id);
    await event.save();

    res.status(200).json({
      status: 'success',
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

// Unregister from event
router.delete('/:id/register', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found',
      });
    }

    event.attendees = event.attendees.filter(
      (attendee) => attendee.toString() !== req.user.id.toString()
    );
    await event.save();

    res.status(200).json({
      status: 'success',
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});

export default router;