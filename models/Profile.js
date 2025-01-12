import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  graduationYear: {
    type: Number,
    required: true,
  },
  degree: {
    type: String,
    required: true,
  },
  major: {
    type: String,
    required: true,
  },
  currentPosition: {
    type: String,
  },
  company: {
    type: String,
  },
  bio: {
    type: String,
  },
  registeredEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;