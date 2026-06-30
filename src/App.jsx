import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, RotateCcw, AlertTriangle, BarChart3 } from 'lucide-react';
import { dataService } from './services/dataService';
import Dashboard from './components/Dashboard';
import GroupDetail from './components/GroupDetail';
import PrepDashboard from './components/PrepDashboard';
import Analytics from './components/Analytics';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, prep
  const [activeGroupId, setActiveGroupId] = useState(null);
  
  // App States
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [activeUser, setActiveUser] = useState('Rahul');

  // Load all data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const fetchedGroups = dataService.getGroups();
    setGroups(fetchedGroups);
    setExpenses(dataService.getExpenses());
    setSettlements(dataService.getSettlements());

    // Fallback active user if current one is deleted
    const allUsers = Array.from(new Set(fetchedGroups.flatMap(g => g.members)));
    if (allUsers.length > 0 && !allUsers.includes(activeUser)) {
      setActiveUser(allUsers[0]);
    }
  };

  const handleSelectGroup = (id) => {
    setActiveGroupId(id);
    setActiveTab('groups');
  };

  const handleCreateGroup = (groupData) => {
    const newGroup = dataService.saveGroup(groupData);
    refreshData();
    // Auto navigate to the newly created group
    handleSelectGroup(newGroup.id);
  };

  const handleAddExpense = (expenseData) => {
    dataService.saveExpense(expenseData);
    refreshData();
  };

  const handleDeleteExpense = (expenseId) => {
    dataService.deleteExpense(expenseId);
    refreshData();
  };

  const handleRecordSettlement = (settlementData) => {
    if (settlementData.systemAction === 'add_member') {
      dataService.saveGroup(settlementData.updatedGroup);
      refreshData();
      return;
    }
    
    dataService.recordSettlement(settlementData);
    refreshData();
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data back to the default demo state? This will overwrite your current changes.')) {
      dataService.resetAll();
      refreshData();
      setActiveGroupId(null);
      setActiveTab('dashboard');
    }
  };

  // Find currently active group details
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const activeGroupExpenses = expenses.filter(e => e.groupId === activeGroupId);
  const activeGroupSettlements = settlements.filter(s => s.groupId === activeGroupId);

  return (
    <div className="app-shell dark-theme">
      {/* Top Navigation Bar */}
      <header className="app-header glass">
        <div className="nav-container">
          <div className="logo-brand" onClick={() => { setActiveTab('dashboard'); setActiveGroupId(null); }}>
            <span className="logo-icon">⚖️</span>
            <span className="logo-text">SettleWise</span>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-item ${activeTab === 'dashboard' && !activeGroupId ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setActiveGroupId(null); }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => { setActiveTab('analytics'); setActiveGroupId(null); }}
            >
              <BarChart3 size={16} />
              <span>Analytics</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'prep' ? 'active' : ''}`}
              onClick={() => { setActiveTab('prep'); setActiveGroupId(null); }}
            >
              <BookOpen size={16} />
              <span>Interview Prep</span>
            </button>
          </nav>

          <div className="nav-actions">
            <button 
              onClick={handleResetData} 
              className="btn btn-secondary btn-sm btn-icon-label"
              title="Reset data back to default demo state"
            >
              <RotateCcw size={14} />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main-content">
        {activeTab === 'dashboard' && !activeGroupId && (
          <Dashboard 
            groups={groups}
            allExpenses={expenses}
            allSettlements={settlements}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={handleCreateGroup}
            activeUser={activeUser}
            setActiveUser={setActiveUser}
          />
        )}

        {activeTab === 'groups' && activeGroup && (
          <GroupDetail
            group={activeGroup}
            expenses={activeGroupExpenses}
            settlements={activeGroupSettlements}
            onBack={() => { setActiveTab('dashboard'); setActiveGroupId(null); }}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onEditExpense={handleAddExpense} // uses same save method
            onRecordSettlement={handleRecordSettlement}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            groups={groups}
            allExpenses={expenses}
            allSettlements={settlements}
            activeUser={activeUser}
          />
        )}

        {activeTab === 'prep' && (
          <PrepDashboard />
        )}
      </main>

      {/* Subtle footer */}
      <footer className="app-footer">
        <p>Built with Antigravity AI — MERN Intern Demo Prep Project</p>
      </footer>
    </div>
  );
}
