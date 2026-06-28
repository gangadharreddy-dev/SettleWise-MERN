import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, DollarSign, Calendar, Trash2, Edit2, 
  ArrowRight, Users, TrendingUp, CheckCircle, Info, Sparkles, Send
} from 'lucide-react';
import { calculateNetBalances, simplifyDebts } from '../utils/debtSimplifier';
import ExpenseForm from './ExpenseForm';
import confetti from 'canvas-confetti';

export default function GroupDetail({ group, expenses, settlements, onBack, onAddExpense, onDeleteExpense, onEditExpense, onRecordSettlement }) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [memberError, setMemberError] = useState('');
  
  // Calculate balances
  const netBalances = calculateNetBalances(group.members, expenses);
  const simplifiedDebts = simplifyDebts(netBalances);

  // Success Settlement Confetti Trigger
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleSettleUp = (debt) => {
    if (window.confirm(`Log a settlement payment of ₹${debt.amount} from ${debt.from} to ${debt.to}?`)) {
      onRecordSettlement({
        groupId: group.id,
        from: debt.from,
        to: debt.to,
        amount: debt.amount
      });
      triggerConfetti();
    }
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    const name = newMemberName.trim();
    if (!name) return;
    
    if (group.members.some(m => m.toLowerCase() === name.toLowerCase())) {
      setMemberError('Member name already exists in this group.');
      return;
    }

    setMemberError('');
    // Save updated group
    const updatedGroup = {
      ...group,
      members: [...group.members, name]
    };
    onRecordSettlement({
      groupId: group.id,
      systemAction: 'add_member',
      updatedGroup
    });
    setNewMemberName('');
  };

  return (
    <div className="group-detail-container animated-fade-in">
      <div className="back-nav">
        <button onClick={onBack} className="btn-link">
          <ArrowLeft size={16} />
          <span>Back to Groups</span>
        </button>
      </div>

      <div className="group-detail-header card glass">
        <div className="header-main">
          <div>
            <h1>{group.name}</h1>
            <p className="description">{group.description || 'No description provided.'}</p>
          </div>
          <button 
            onClick={() => {
              setExpenseToEdit(null);
              setShowAddExpense(true);
            }} 
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Member management */}
        <div className="members-section">
          <div className="members-title">
            <Users size={16} />
            <span>Members ({group.members.length}):</span>
          </div>
          <div className="members-list-tags">
            {group.members.map(m => (
              <span key={m} className="member-tag">{m}</span>
            ))}
            <form onSubmit={handleAddMember} className="add-member-inline">
              <input
                type="text"
                placeholder="+ Add member"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
              <button type="submit" className="btn-send"><Send size={12} /></button>
            </form>
          </div>
          {memberError && <p className="error-text">{memberError}</p>}
        </div>
      </div>

      {/* Grid: Balance Breakdown & Settlement Engine */}
      <div className="detail-grid">
        {/* Left Side: Expenses list */}
        <div className="left-side">
          <div className="section-title-row">
            <h2>Expense Log</h2>
            <span className="badge">{expenses.length} Expenses</span>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-state card glass">
              <p>No expenses added yet.</p>
              <button 
                onClick={() => setShowAddExpense(true)} 
                className="btn btn-secondary btn-sm"
              >
                Create your first expense
              </button>
            </div>
          ) : (
            <div className="expense-list-scroller">
              {expenses.map((expense) => {
                const dateStr = new Date(expense.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                return (
                  <div key={expense.id} className="expense-item card glass hover-scale">
                    <div className="expense-cat-badge">
                      {expense.category || 'General'}
                    </div>
                    <div className="expense-item-main">
                      <div className="expense-info">
                        <h3>{expense.title}</h3>
                        <p className="details">
                          Paid by <strong className="highlight">{expense.paidBy}</strong> on {dateStr}
                        </p>
                        <p className="split-detail-desc">
                          Split method: {expense.splitType === 'equal' ? 'Equally' : expense.splitType === 'exact' ? 'Exact splits' : 'Percentages'}
                        </p>
                      </div>
                      <div className="expense-value-row">
                        <div className="expense-amount">
                          ₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="expense-actions">
                          <button 
                            onClick={() => {
                              setExpenseToEdit(expense);
                              setShowAddExpense(true);
                            }} 
                            className="btn-icon" 
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Delete this expense?')) {
                                onDeleteExpense(expense.id);
                              }
                            }} 
                            className="btn-icon delete" 
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct Settlements History */}
          {settlements.length > 0 && (
            <div className="settlement-history-section margin-top-lg">
              <h3 className="sub-section-title">Direct Settlements History</h3>
              <div className="settlements-scroller">
                {settlements.map((s) => (
                  <div key={s.id} className="settlement-log-item card glass-light">
                    <CheckCircle size={14} className="success-icon" />
                    <span>
                      <strong>{s.from}</strong> paid <strong>{s.to}</strong>
                    </span>
                    <span className="settled-amount">
                      ₹{s.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Balances & Simplified Settlement Suggestions */}
        <div className="right-side">
          <div className="section-title-row">
            <h2>Debt Settlement Engine</h2>
            <Sparkles size={16} className="icon-vibrant" />
          </div>

          {/* Member Net Balances */}
          <div className="net-balances-card card glass">
            <h3>Net Balance Sheets</h3>
            <div className="balance-breakdown-list">
              {group.members.map((member) => {
                const bal = netBalances[member] || 0;
                const isPositive = bal > 0.01;
                const isNegative = bal < -0.01;
                
                return (
                  <div key={member} className="balance-breakdown-row">
                    <span className="member-name">{member}</span>
                    <span className={`member-balance ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                      {isPositive ? '+' : ''}₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simplified Debt Resolution */}
          <div className="simplified-debts-card card glass margin-top">
            <div className="card-header-row">
              <h3>Simplification Log</h3>
              <div className="tooltip-container">
                <Info size={14} className="text-secondary" />
                <span className="tooltip-text">Simplifies debts using a Greedy Min-Max algorithm to reduce overall transfers.</span>
              </div>
            </div>

            {simplifiedDebts.length === 0 ? (
              <div className="settlement-completed-state">
                <CheckCircle size={32} className="vibrant-green" />
                <p className="title">Everyone is SettleUp!</p>
                <p className="desc">No outstanding balances remaining.</p>
              </div>
            ) : (
              <div className="debts-list">
                {simplifiedDebts.map((debt, idx) => (
                  <div key={idx} className="debt-transfer-item card glass-light hover-scale">
                    <div className="transfer-flow">
                      <div className="person-box debtor">{debt.from}</div>
                      <div className="arrow-box">
                        <span className="transfer-amount">₹{debt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <ArrowRight size={16} />
                      </div>
                      <div className="person-box creditor">{debt.to}</div>
                    </div>
                    <button 
                      onClick={() => handleSettleUp(debt)} 
                      className="btn btn-secondary btn-xs btn-settle"
                    >
                      Record Payment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddExpense && (
        <ExpenseForm
          group={group}
          expenseToEdit={expenseToEdit}
          onClose={() => {
            setShowAddExpense(false);
            setExpenseToEdit(null);
          }}
          onSave={(data) => {
            onAddExpense(data);
            setShowAddExpense(false);
            setExpenseToEdit(null);
          }}
        />
      )}
    </div>
  );
}
