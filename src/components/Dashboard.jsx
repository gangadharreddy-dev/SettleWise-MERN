import React, { useState } from 'react';
import { 
  Users, Plus, PlusCircle, CheckCircle, TrendingUp, TrendingDown, 
  ArrowRight, Landmark, FileText, ChevronRight, X
} from 'lucide-react';
import { calculateNetBalances, simplifyDebts } from '../utils/debtSimplifier';

export default function Dashboard({ groups, allExpenses, allSettlements, onSelectGroup, onCreateGroup, activeUser, setActiveUser }) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [error, setError] = useState('');

  // Collect all unique members across all groups to populate the User Profile selector
  const allUniqueUsers = Array.from(
    new Set(groups.flatMap(g => g.members))
  ).sort();

  // Helper to calculate outstanding balances for the active user
  const calculateUserBalances = () => {
    let youOwe = 0;
    let youAreOwed = 0;
    const groupBalances = {}; // groupId -> user balance

    groups.forEach(group => {
      if (!group.members.includes(activeUser)) return;

      const groupExpenses = allExpenses.filter(e => e.groupId === group.id);
      const netBalances = calculateNetBalances(group.members, groupExpenses);
      const userNet = netBalances[activeUser] || 0;
      
      groupBalances[group.id] = userNet;

      const simplified = simplifyDebts(netBalances);
      simplified.forEach(debt => {
        if (debt.from === activeUser) {
          youOwe += debt.amount;
        } else if (debt.to === activeUser) {
          youAreOwed += debt.amount;
        }
      });
    });

    return {
      net: youAreOwed - youOwe,
      youOwe,
      youAreOwed,
      groupBalances
    };
  };

  const balances = calculateUserBalances();

  const handleCreateGroupSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }

    const members = membersInput
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (members.length < 2) {
      setError('Please add at least 2 members (separated by commas).');
      return;
    }

    // Ensure activeUser is in the group members
    if (!members.some(m => m.toLowerCase() === activeUser.toLowerCase())) {
      members.unshift(activeUser);
    }

    // Deduplicate
    const uniqueMembers = Array.from(new Set(members));

    onCreateGroup({
      name: groupName.trim(),
      description: groupDesc.trim(),
      members: uniqueMembers
    });

    // Reset
    setGroupName('');
    setGroupDesc('');
    setMembersInput('');
    setError('');
    setShowAddGroup(false);
  };

  return (
    <div className="dashboard-container animated-fade-in">
      {/* Top Welcome Panel */}
      <div className="dashboard-header card glass">
        <div className="header-greeting">
          <div>
            <h1>SettleWise Dashboard</h1>
            <p className="subtitle">Track shared bills, split expenses, and settle debts instantly.</p>
          </div>
          <div className="active-user-profile">
            <span className="profile-label">Demo User Context:</span>
            <select 
              value={activeUser} 
              onChange={(e) => setActiveUser(e.target.value)}
              className="user-select-dropdown"
            >
              {allUniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue">
              <Landmark size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Net Balance</span>
              <span className={`stat-value ${balances.net > 0.01 ? 'positive' : balances.net < -0.01 ? 'negative' : 'neutral'}`}>
                {balances.net > 0.01 ? '+' : ''}₹{balances.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper red">
              <TrendingDown size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">You owe overall</span>
              <span className="stat-value negative">
                ₹{balances.youOwe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper green">
              <TrendingUp size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">You are owed overall</span>
              <span className="stat-value positive">
                ₹{balances.youAreOwed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="dashboard-grid">
        {/* Groups List */}
        <div className="groups-list-section">
          <div className="section-title-row">
            <h2>Your Groups</h2>
            <button onClick={() => setShowAddGroup(true)} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>New Group</span>
            </button>
          </div>

          <div className="groups-grid">
            {groups.map(group => {
              const inGroup = group.members.includes(activeUser);
              const groupBal = balances.groupBalances[group.id] || 0;
              const hasPositive = groupBal > 0.01;
              const hasNegative = groupBal < -0.01;

              return (
                <div 
                  key={group.id} 
                  className="group-card card glass hover-scale"
                  onClick={() => onSelectGroup(group.id)}
                >
                  <div className="group-card-header">
                    <h3>{group.name}</h3>
                    <ChevronRight size={18} className="arrow-icon" />
                  </div>
                  <p className="description">{group.description || 'No description.'}</p>
                  
                  <div className="group-card-footer">
                    <div className="group-members-count">
                      <Users size={14} />
                      <span>{group.members.length} members</span>
                    </div>

                    {inGroup ? (
                      <div className="group-balance-summary">
                        {hasPositive && (
                          <span className="balance-indicator positive">
                            You are owed <strong>₹{groupBal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</strong>
                          </span>
                        )}
                        {hasNegative && (
                          <span className="balance-indicator negative">
                            You owe <strong>₹{Math.abs(groupBal).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</strong>
                          </span>
                        )}
                        {!hasPositive && !hasNegative && (
                          <span className="balance-indicator neutral">
                            No outstanding balance
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="balance-indicator guest">
                        Non-member (Spectator)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Recent Activity Log */}
        <div className="recent-activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-card card glass">
            {allExpenses.length === 0 && allSettlements.length === 0 ? (
              <p className="empty-text">No activity logged yet.</p>
            ) : (
              <div className="activity-scroller">
                {[
                  ...allExpenses.map(e => ({ ...e, type: 'expense' })),
                  ...allSettlements.map(s => ({ ...s, type: 'settlement' }))
                ]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 8)
                  .map((item, idx) => {
                    const groupName = groups.find(g => g.id === item.groupId)?.name || 'Group';
                    const dateStr = new Date(item.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    });

                    if (item.type === 'expense') {
                      return (
                        <div key={idx} className="activity-item">
                          <div className="activity-bullet blue"></div>
                          <div className="activity-content">
                            <span className="activity-text">
                              <strong>{item.paidBy}</strong> added <strong>"{item.title}"</strong> in <em>{groupName}</em>
                            </span>
                            <span className="activity-time">{dateStr}</span>
                          </div>
                          <span className="activity-amount">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={idx} className="activity-item">
                          <div className="activity-bullet green"></div>
                          <div className="activity-content">
                            <span className="activity-text">
                              <strong>{item.from}</strong> settled with <strong>{item.to}</strong> in <em>{groupName}</em>
                            </span>
                            <span className="activity-time">{dateStr}</span>
                          </div>
                          <span className="activity-amount settled">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    }
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="modal-overlay">
          <div className="modal-content glass card animated-fade-in">
            <div className="modal-header">
              <h3>Create New Group</h3>
              <button onClick={() => setShowAddGroup(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit}>
              {error && <div className="error-banner">{error}</div>}

              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Roommates, Trip to Manali"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Splitting monthly flat bills"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Members (comma separated names)</label>
                <textarea
                  placeholder="Rahul, Amit, Karan, Sneha"
                  value={membersInput}
                  onChange={(e) => setMembersInput(e.target.value)}
                  required
                  rows="3"
                  className="textarea-input"
                />
                <p className="input-hint">Enter your friends' names. You ({activeUser}) will be included automatically.</p>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddGroup(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
