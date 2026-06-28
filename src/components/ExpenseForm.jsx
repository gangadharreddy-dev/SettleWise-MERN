import React, { useState, useEffect } from 'react';
import { Plus, X, DollarSign, Calendar, Tag, Users, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'General',
  'Accommodation',
  'Food & Drinks',
  'Transport',
  'Entertainment',
  'Groceries',
  'Utilities'
];

export default function ExpenseForm({ group, onSave, onClose, expenseToEdit = null }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [splitType, setSplitType] = useState('equal'); // equal, exact, percentage
  
  // Which members are involved in the split (for equal split)
  const [involvedMembers, setInvolvedMembers] = useState([]);
  
  // Custom split values (name -> value)
  const [splits, setSplits] = useState({});
  const [error, setError] = useState('');

  // Initialize form
  useEffect(() => {
    if (group) {
      setInvolvedMembers(group.members);
      setPaidBy(group.members[0] || '');
      
      // Initialize splits
      const initialSplits = {};
      group.members.forEach(m => {
        initialSplits[m] = '';
      });
      setSplits(initialSplits);
    }

    if (expenseToEdit) {
      setTitle(expenseToEdit.title || '');
      setAmount(expenseToEdit.amount || '');
      setPaidBy(expenseToEdit.paidBy || '');
      setCategory(expenseToEdit.category || 'General');
      if (expenseToEdit.date) {
        setDate(new Date(expenseToEdit.date).toISOString().substring(0, 10));
      }
      setSplitType(expenseToEdit.splitType || 'equal');
      if (expenseToEdit.involvedMembers) {
        setInvolvedMembers(expenseToEdit.involvedMembers);
      }
      if (expenseToEdit.splits) {
        setSplits({ ...expenseToEdit.splits });
      }
    }
  }, [group, expenseToEdit]);

  const handleInvolvedToggle = (member) => {
    if (involvedMembers.includes(member)) {
      if (involvedMembers.length > 1) {
        setInvolvedMembers(involvedMembers.filter(m => m !== member));
      }
    } else {
      setInvolvedMembers([...involvedMembers, member]);
    }
  };

  const handleSplitValueChange = (member, value) => {
    setSplits({
      ...splits,
      [member]: value
    });
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Please enter a description/title.');
      return false;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return false;
    }
    if (!paidBy) {
      setError('Please select who paid.');
      return false;
    }

    if (splitType === 'equal') {
      if (involvedMembers.length === 0) {
        setError('At least one member must be selected to split the bill.');
        return false;
      }
    } else if (splitType === 'exact') {
      let totalSplitAmount = 0;
      for (const m of group.members) {
        const val = parseFloat(splits[m]) || 0;
        if (val < 0) {
          setError('Split amounts cannot be negative.');
          return false;
        }
        totalSplitAmount += val;
      }
      // Check if it adds up to total amount
      if (Math.abs(totalSplitAmount - numAmount) > 0.05) {
        setError(`Exact splits (total: ₹${totalSplitAmount.toFixed(2)}) must sum to the total expense amount (₹${numAmount.toFixed(2)}). Difference: ₹${(numAmount - totalSplitAmount).toFixed(2)}`);
        return false;
      }
    } else if (splitType === 'percentage') {
      let totalPercent = 0;
      for (const m of group.members) {
        const val = parseFloat(splits[m]) || 0;
        if (val < 0) {
          setError('Percentages cannot be negative.');
          return false;
        }
        totalPercent += val;
      }
      if (Math.abs(totalPercent - 100) > 0.1) {
        setError(`Percentages must sum up to exactly 100%. Current sum: ${totalPercent.toFixed(1)}%`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const numAmount = parseFloat(amount);
    const expenseData = {
      id: expenseToEdit?.id,
      groupId: group.id,
      title: title.trim(),
      amount: numAmount,
      paidBy,
      splitType,
      category,
      date: new Date(date).toISOString(),
      involvedMembers: splitType === 'equal' ? involvedMembers : [],
      splits: splitType !== 'equal' ? Object.keys(splits).reduce((acc, member) => {
        acc[member] = parseFloat(splits[member]) || 0;
        return acc;
      }, {}) : {}
    };

    onSave(expenseData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass card animated-fade-in">
        <div className="modal-header">
          <h3>{expenseToEdit ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Description</label>
            <div className="input-with-icon">
              <Tag size={16} className="input-icon" />
              <input
                type="text"
                placeholder="e.g. Flight tickets, Dinner, Groceries"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹)</label>
              <div className="input-with-icon">
                <DollarSign size={16} className="input-icon" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Date</label>
              <div className="input-with-icon">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Paid By</label>
              <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="select-input">
                {group.members.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="split-type-selector">
            <label>Split Type</label>
            <div className="segmented-control">
              <button
                type="button"
                className={splitType === 'equal' ? 'active' : ''}
                onClick={() => setSplitType('equal')}
              >
                Equally
              </button>
              <button
                type="button"
                className={splitType === 'exact' ? 'active' : ''}
                onClick={() => setSplitType('exact')}
              >
                Exact Amounts
              </button>
              <button
                type="button"
                className={splitType === 'percentage' ? 'active' : ''}
                onClick={() => setSplitType('percentage')}
              >
                Percentages
              </button>
            </div>
          </div>

          {/* EQUAL SPLIT UI */}
          {splitType === 'equal' && (
            <div className="split-details-panel">
              <div className="panel-title">
                <Users size={16} />
                <span>Split equally between:</span>
              </div>
              <div className="members-checkbox-list">
                {group.members.map((member) => {
                  const isChecked = involvedMembers.includes(member);
                  const share = parseFloat(amount) ? (parseFloat(amount) / involvedMembers.length).toFixed(2) : '0.00';
                  return (
                    <div 
                      key={member} 
                      className={`member-checkbox-item ${isChecked ? 'selected' : ''}`}
                      onClick={() => handleInvolvedToggle(member)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                      />
                      <span className="member-name">{member}</span>
                      {isChecked && <span className="member-share-preview">₹{share}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXACT SPLIT UI */}
          {splitType === 'exact' && (
            <div className="split-details-panel">
              <div className="panel-title">
                <Users size={16} />
                <span>Specify exact shares (Total should equal ₹{parseFloat(amount) || 0}):</span>
              </div>
              <div className="members-inputs-list">
                {group.members.map((member) => (
                  <div key={member} className="member-input-item">
                    <span className="member-name">{member}</span>
                    <div className="input-small-wrapper">
                      <span className="currency-prefix">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splits[member] || ''}
                        onChange={(e) => handleSplitValueChange(member, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PERCENTAGE SPLIT UI */}
          {splitType === 'percentage' && (
            <div className="split-details-panel">
              <div className="panel-title">
                <Users size={16} />
                <span>Specify percentage splits (Must sum to 100%):</span>
              </div>
              <div className="members-inputs-list">
                {group.members.map((member) => {
                  const percent = parseFloat(splits[member]) || 0;
                  const share = parseFloat(amount) ? ((percent / 100) * parseFloat(amount)).toFixed(2) : '0.00';
                  return (
                    <div key={member} className="member-input-item">
                      <span className="member-name">{member}</span>
                      <div className="input-small-pair">
                        <div className="input-small-wrapper">
                          <input
                            type="number"
                            placeholder="0"
                            value={splits[member] || ''}
                            onChange={(e) => handleSplitValueChange(member, e.target.value)}
                          />
                          <span className="percent-suffix">%</span>
                        </div>
                        <span className="calc-share-preview">₹{share}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
