const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/settlewise';
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully.');
    seedDatabase();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// --- API ROUTES ---

// Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SettleWise MERN API Service' });
});

// GET all groups
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET group details
app.get('/api/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create group
app.post('/api/groups', async (req, res) => {
  try {
    const newGroup = new Group({
      name: req.body.name,
      description: req.body.description,
      members: req.body.members
    });
    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a group (and associated expenses/settlements)
app.delete('/api/groups/:id', async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Cascade delete
    await Expense.deleteMany({ groupId: req.params.id });
    await Settlement.deleteMany({ groupId: req.params.id });
    
    res.json({ message: 'Group and associated data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all expenses (or filter by group)
app.get('/api/expenses', async (req, res) => {
  try {
    const { groupId } = req.query;
    const filter = groupId ? { groupId } : {};
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add expense
app.post('/api/expenses', async (req, res) => {
  try {
    const newExpense = new Expense(req.body);
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all settlements (or filter by group)
app.get('/api/settlements', async (req, res) => {
  try {
    const { groupId } = req.query;
    const filter = groupId ? { groupId } : {};
    const settlements = await Settlement.find(filter).sort({ date: -1 });
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST log a settlement
app.post('/api/settlements', async (req, res) => {
  try {
    const newSettlement = new Settlement(req.body);
    const savedSettlement = await newSettlement.save();
    res.status(201).json(savedSettlement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- DB SEEDING FUNCTION ---
async function seedDatabase() {
  try {
    const groupCount = await Group.countDocuments();
    if (groupCount > 0) {
      console.log('Database already populated. Skipping seed.');
      return;
    }

    console.log('Seeding initial SettleWise data...');

    // 1. Seed Groups
    const groupGoa = new Group({
      name: 'Goa Trip 🏖️',
      description: 'Road trip and beach villa stay with friends',
      members: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram']
    });
    const savedGoa = await groupGoa.save();

    const groupFlat = new Group({
      name: 'Flat 203 Roomies 🏠',
      description: 'Monthly rent, groceries, and utilities',
      members: ['Rahul', 'Amit', 'Karan']
    });
    const savedFlat = await groupFlat.save();

    // 2. Seed Expenses
    await Expense.insertMany([
      {
        groupId: savedGoa._id,
        title: 'Villa Stay Deposit',
        amount: 15000,
        paidBy: 'Rahul',
        splitType: 'equal',
        involvedMembers: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram'],
        category: 'Accommodation',
        date: new Date('2026-06-21T12:00:00.000Z')
      },
      {
        groupId: savedGoa._id,
        title: 'Beach Dinner & Drinks',
        amount: 4500,
        paidBy: 'Priya',
        splitType: 'equal',
        involvedMembers: ['Rahul', 'Priya', 'Amit', 'Sneha'],
        category: 'Food & Drinks',
        date: new Date('2026-06-22T21:30:00.000Z')
      },
      {
        groupId: savedGoa._id,
        title: 'Scuba Diving (Sneha & Vikram only)',
        amount: 6000,
        paidBy: 'Amit',
        splitType: 'exact',
        splits: { 'Sneha': 3000, 'Vikram': 3000 },
        category: 'Entertainment',
        date: new Date('2026-06-23T10:15:00.000Z')
      },
      {
        groupId: savedGoa._id,
        title: 'Fuel for SUV',
        amount: 3500,
        paidBy: 'Vikram',
        splitType: 'percentage',
        splits: { 'Rahul': 20, 'Priya': 20, 'Amit': 20, 'Sneha': 20, 'Vikram': 20 },
        category: 'Transport',
        date: new Date('2026-06-24T15:45:00.000Z')
      },
      {
        groupId: savedFlat._id,
        title: 'High-Speed Wi-Fi',
        amount: 1200,
        paidBy: 'Karan',
        splitType: 'equal',
        involvedMembers: ['Rahul', 'Amit', 'Karan'],
        category: 'Utilities',
        date: new Date('2026-06-02T11:00:00.000Z')
      },
      {
        groupId: savedFlat._id,
        title: 'Groceries & Milk',
        amount: 3200,
        paidBy: 'Amit',
        splitType: 'equal',
        involvedMembers: ['Rahul', 'Amit', 'Karan'],
        category: 'Groceries',
        date: new Date('2026-06-15T19:00:00.000Z')
      }
    ]);

    // 3. Seed Settlements
    await Settlement.insertMany([
      {
        groupId: savedGoa._id,
        from: 'Sneha',
        to: 'Rahul',
        amount: 1500,
        date: new Date('2026-06-25T18:20:00.000Z')
      }
    ]);

    console.log('Database seeded successfully.');
  } catch (err) {
    console.error('Failed to seed database:', err);
  }
}

// Start Server
app.listen(PORT, () => {
  console.log(`SettleWise Server running on port ${PORT}`);
});
