const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group ID reference is required']
  },
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  paidBy: {
    type: String, // Member name who paid
    required: [true, 'Payer name is required']
  },
  splitType: {
    type: String,
    enum: ['equal', 'exact', 'percentage'],
    default: 'equal'
  },
  involvedMembers: [{
    type: String // Storing names of members involved in split (used for 'equal' split)
  }],
  splits: {
    type: Map,
    of: Number // Storing absolute shares or percentage rates per member
  },
  category: {
    type: String,
    default: 'General'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
