const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  icon:        { type: String, default: '📖' }, // emoji icon
  color:       { type: String, default: '#8B1A1A' }, // hex accent color
  storyCount:  { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
