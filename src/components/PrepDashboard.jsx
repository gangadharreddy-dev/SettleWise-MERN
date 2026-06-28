import React, { useState } from 'react';
import { Database, Server, Cpu, Sparkles, Code, BookOpen, ChevronRight } from 'lucide-react';

export default function PrepDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('schema');

  const schemas = {
    user: `// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // Hashed
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);`,
    
    group: `// models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  members: [{ type: String, required: true }], // Stores names/emails of members
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', GroupSchema);`,

    expense: `// models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  paidBy: { type: String, required: true }, // Name of the member who paid
  splitType: { type: String, enum: ['equal', 'exact', 'percentage'], default: 'equal' },
  splits: { type: Map, of: Number }, // e.g. { "Amit": 3000, "Sneha": 3000 } or percentages
  involvedMembers: [{ type: String }],
  category: { type: String, default: 'General' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);`
  };

  const apis = `// server.js - Express API Routes
const express = require('express');
const router = express.Router();
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');

// 1. Get all groups for a user
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Create a new group
router.post('/groups', async (req, res) => {
  const group = new Group({
    name: req.body.name,
    description: req.body.description,
    members: req.body.members
  });
  try {
    const newGroup = await group.save();
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Get expenses for a group
router.get('/groups/:groupId/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.groupId });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Create an expense
router.post('/expenses', async (req, res) => {
  const expense = new Expense(req.body);
  try {
    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 5. Record a settlement
router.post('/settlements', async (req, res) => {
  const settlement = new Settlement({
    groupId: req.body.groupId,
    from: req.body.from,
    to: req.body.to,
    amount: req.body.amount
  });
  try {
    const newSettlement = await settlement.save();
    res.status(201).json(newSettlement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});`;

  const algoExplanation = `// How the Greedy Debt Simplification Algorithm Works:
// Time Complexity: O(N log N) due to sorting in each step
// Space Complexity: O(N) where N is number of group members

function simplifyDebts(netBalances) {
  const debtors = [];    // Members with negative balances (owe money)
  const creditors = [];  // Members with positive balances (are owed money)

  // 1. Separate debtors and creditors
  for (let member in netBalances) {
    let bal = netBalances[member];
    if (bal < 0) debtors.push({ name: member, balance: Math.abs(bal) });
    else if (bal > 0) creditors.push({ name: member, balance: bal });
  }

  const transactions = [];

  // 2. Repeatedly pair the largest debtor with the largest creditor
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    let debtor = debtors[0];
    let creditor = creditors[0];

    // Find the maximum settleable amount (limiting factor is the smaller of the two balances)
    let settledAmount = Math.min(debtor.balance, creditor.balance);
    
    transactions.push({
      from: debtor.name,
      to: creditor.name,
      amount: settledAmount
    });

    // Update balances
    debtor.balance -= settledAmount;
    creditor.balance -= settledAmount;

    // Remove users who have been fully settled
    if (debtor.balance === 0) debtors.shift();
    if (creditor.balance === 0) creditors.shift();
  }

  return transactions;
}`;

  return (
    <div className="prep-container">
      <div className="prep-header">
        <Sparkles className="icon-vibrant" />
        <div>
          <h2>Interview Prep & Tech Architecture Dashboard</h2>
          <p className="subtitle">Ready-to-explain concepts, schemas, algorithms, and AI workflows for your Makers Tribe interview.</p>
        </div>
      </div>

      <div className="prep-navigation">
        <button 
          className={`prep-nav-btn ${activeSubTab === 'schema' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('schema')}
        >
          <Database size={18} />
          <span>MongoDB Schemas</span>
        </button>
        <button 
          className={`prep-nav-btn ${activeSubTab === 'apis' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('apis')}
        >
          <Server size={18} />
          <span>Express APIs</span>
        </button>
        <button 
          className={`prep-nav-btn ${activeSubTab === 'algo' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('algo')}
        >
          <Cpu size={18} />
          <span>Settlement Algorithm</span>
        </button>
        <button 
          className={`prep-nav-btn ${activeSubTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('ai')}
        >
          <Code size={18} />
          <span>AI Dev Process</span>
        </button>
      </div>

      <div className="prep-content card glass">
        {activeSubTab === 'schema' && (
          <div>
            <h3>Mongoose Document Schemas (MongoDB)</h3>
            <p className="description">
              In a full MERN implementation, SettleWise uses three primary collections: <strong>Users</strong>, <strong>Groups</strong>, and <strong>Expenses</strong>. Relationships are modeled using mongoose references (ObjectIDs).
            </p>
            <div className="schema-switch-row">
              <span className="badge">Mongoose Models</span>
              <span className="info-text">Select a model code below to review:</span>
            </div>
            
            <div className="code-panels-grid">
              <div>
                <h4 className="code-panel-title">User Model</h4>
                <pre><code>{schemas.user}</code></pre>
              </div>
              <div>
                <h4 className="code-panel-title">Group Model</h4>
                <pre><code>{schemas.group}</code></pre>
              </div>
            </div>
            <div className="code-panel-full margin-top">
              <h4 className="code-panel-title">Expense Model (supporting multiple split methods)</h4>
              <pre><code>{schemas.expense}</code></pre>
            </div>
          </div>
        )}

        {activeSubTab === 'apis' && (
          <div>
            <h3>Express REST API Routes (Node.js backend)</h3>
            <p className="description">
              The backend layer exposes standard HTTP endpoints to client requests. The frontend service layer is structured to hit these endpoints.
            </p>
            <div className="endpoint-list-grid">
              <div className="endpoint-card">
                <span className="method get">GET</span>
                <span className="path">/api/groups</span>
                <span className="desc">Fetch all groups for the active user session</span>
              </div>
              <div className="endpoint-card">
                <span className="method post">POST</span>
                <span className="path">/api/groups</span>
                <span className="desc">Create new group with an array of member names</span>
              </div>
              <div className="endpoint-card">
                <span className="method get">GET</span>
                <span className="path">/api/groups/:groupId/expenses</span>
                <span className="desc">Fetch all expense records associated with a group</span>
              </div>
              <div className="endpoint-card">
                <span className="method post">POST</span>
                <span className="path">/api/expenses</span>
                <span className="desc">Log a new expense (splits are computed and saved)</span>
              </div>
              <div className="endpoint-card">
                <span className="method post">POST</span>
                <span className="path">/api/settlements</span>
                <span className="desc">Record a direct transaction settling debt between two users</span>
              </div>
            </div>
            <div className="code-panel-full margin-top">
              <h4 className="code-panel-title">Express Controller Code Template</h4>
              <pre><code>{apis}</code></pre>
            </div>
          </div>
        )}

        {activeSubTab === 'algo' && (
          <div>
            <h3>Greedy Debt Simplification Engine</h3>
            <p className="description">
              The algorithm solves the multi-party debt settlement problem by minimizing the total number of transactions needed to clear all balances. It prevents unnecessary loops (e.g. A owes B who owes C who owes A).
            </p>
            <div className="alert-box info">
              <strong>Algorithm Explanation:</strong>
              <ol>
                <li>Compute the net balance of each user: <code>balance = (amount paid) - (share of expenses)</code>.</li>
                <li>Separate members into <strong>debtors</strong> (negative balance) and <strong>creditors</strong> (positive balance).</li>
                <li>Find the member who owes the most (max debtor) and the member who is owed the most (max creditor).</li>
                <li>Create a transaction from the max debtor to the max creditor equal to the minimum of their absolute balances.</li>
                <li>Deduct this settled amount from both users' balances. If a user reaches 0 balance, remove them from calculations.</li>
                <li>Repeat steps 3-5 until all balances are resolved to 0.</li>
              </ol>
            </div>
            <div className="code-panel-full">
              <h4 className="code-panel-title">Greedy Debt Simplification (JavaScript)</h4>
              <pre><code>{algoExplanation}</code></pre>
            </div>
          </div>
        )}

        {activeSubTab === 'ai' && (
          <div>
            <h3>How AI Helped in Development ("Vibe Coding" explanation)</h3>
            <p className="description">
              Makers Tribe values candidates who are comfortable with AI-assisted development (Vibe Coding) but maintain ownership and deep understanding of their code. Here's a structured approach you can use to explain your development process:
            </p>
            
            <div className="ai-tips-grid">
              <div className="ai-tip-card">
                <div className="tip-header">
                  <BookOpen size={20} className="icon-accent" />
                  <h4>1. Architecture Scaffolding</h4>
                </div>
                <p>
                  "I used the Antigravity AI coding assistant to quickly scaffold the React project layout, CSS design systems, and model templates. This allowed me to focus my engineering efforts on implementing the core business logic—specifically the debt splitting formulas and settlement algorithms."
                </p>
              </div>

              <div className="ai-tip-card">
                <div className="tip-header">
                  <Cpu size={20} className="icon-accent" />
                  <h4>2. Algorithmic Optimization</h4>
                </div>
                <p>
                  "I worked closely with AI to write the greedy transaction simplifier. I guided the model to handle fractional splits, unequal distribution calculations, and edge cases like floating point rounding, reviewing the recursive state changes to verify correctness."
                </p>
              </div>

              <div className="ai-tip-card">
                <div className="tip-header">
                  <Sparkles size={20} className="icon-accent" />
                  <h4>3. Premium Aesthetics</h4>
                </div>
                <p>
                  "To build a state-of-the-art UI that feels native, I prompt-engineered modern glassmorphism panels, CSS variable-based dark color schemes, and micro-interactions (like hover scaling and custom scrollbars) that set this clone apart from standard, basic CRUD projects."
                </p>
              </div>

              <div className="ai-tip-card">
                <div className="tip-header">
                  <Code size={20} className="icon-accent" />
                  <h4>4. Code Ownership</h4>
                </div>
                <p>
                  "AI served as my expert pair-programmer. I am fully responsible for this code—I understand the state routing, how the LocalStorage fallback interacts with potential Mongo schemas, and the algorithmic logic behind the net balance calculations."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
