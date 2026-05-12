const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      role: { type: String, enum: ['admin', 'member'], default: 'member' },
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
