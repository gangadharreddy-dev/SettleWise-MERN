const mongoose = require('mongoose');

const SettlementSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  from: {
    type: String, // Debtor name
    required: true
  },
  to: {
    type: String, // Creditor name
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settlement', SettlementSchema);
