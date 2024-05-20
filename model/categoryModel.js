const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Remove leading/trailing whitespace
    minlength: [2, 'Name must be at least 2 characters long'], // Minimum length validator
    maxlength: [50, 'Name cannot exceed 50 characters'], // Maximum length validator
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'], // Maximum length validator
  },
  is_list: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Category', categorySchema);

