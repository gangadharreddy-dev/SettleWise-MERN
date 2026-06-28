/**
 * SettleWise Local Storage Service
 * Handles data persistence and pre-populates realistic mock data for instant interview demos.
 */

const STORAGE_KEYS = {
  GROUPS: 'settlewise_groups',
  EXPENSES: 'settlewise_expenses',
  SETTLEMENTS: 'settlewise_settlements'
};

const DEFAULT_GROUPS = [
  {
    id: 'group-goa-2026',
    name: 'Goa Trip 🏖️',
    description: 'Road trip and beach villa stay with friends',
    members: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram'],
    createdAt: '2026-06-20T10:00:00.000Z'
  },
  {
    id: 'group-flat-203',
    name: 'Flat 203 Roomies 🏠',
    description: 'Monthly rent, groceries, and utilities',
    members: ['Rahul', 'Amit', 'Karan'],
    createdAt: '2026-06-01T08:00:00.000Z'
  }
];

const DEFAULT_EXPENSES = [
  // Goa Trip Expenses
  {
    id: 'exp-1',
    groupId: 'group-goa-2026',
    title: 'Villa Stay Deposit',
    amount: 15000,
    paidBy: 'Rahul',
    splitType: 'equal',
    involvedMembers: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram'],
    category: 'Accommodation',
    date: '2026-06-21T12:00:00.000Z'
  },
  {
    id: 'exp-2',
    groupId: 'group-goa-2026',
    title: 'Beach Dinner & Drinks',
    amount: 4500,
    paidBy: 'Priya',
    splitType: 'equal',
    involvedMembers: ['Rahul', 'Priya', 'Amit', 'Sneha'],
    category: 'Food & Drinks',
    date: '2026-06-22T21:30:00.000Z'
  },
  {
    id: 'exp-3',
    groupId: 'group-goa-2026',
    title: 'Scuba Diving (Sneha & Vikram only)',
    amount: 6000,
    paidBy: 'Amit',
    splitType: 'exact',
    splits: { 'Sneha': 3000, 'Vikram': 3000 },
    involvedMembers: ['Sneha', 'Vikram'],
    category: 'Entertainment',
    date: '2026-06-23T10:15:00.000Z'
  },
  {
    id: 'exp-4',
    groupId: 'group-goa-2026',
    title: 'Fuel for SUV',
    amount: 3500,
    paidBy: 'Vikram',
    splitType: 'percentage',
    splits: { 'Rahul': 20, 'Priya': 20, 'Amit': 20, 'Sneha': 20, 'Vikram': 20 },
    involvedMembers: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram'],
    category: 'Transport',
    date: '2026-06-24T15:45:00.000Z'
  },
  // Flat 203 Expenses
  {
    id: 'exp-5',
    groupId: 'group-flat-203',
    title: 'High-Speed Wi-Fi',
    amount: 1200,
    paidBy: 'Karan',
    splitType: 'equal',
    involvedMembers: ['Rahul', 'Amit', 'Karan'],
    category: 'Utilities',
    date: '2026-06-02T11:00:00.000Z'
  },
  {
    id: 'exp-6',
    groupId: 'group-flat-203',
    title: 'Groceries & Milk',
    amount: 3200,
    paidBy: 'Amit',
    splitType: 'equal',
    involvedMembers: ['Rahul', 'Amit', 'Karan'],
    category: 'Groceries',
    date: '2026-06-15T19:00:00.000Z'
  }
];

const DEFAULT_SETTLEMENTS = [
  {
    id: 'settle-1',
    groupId: 'group-goa-2026',
    from: 'Sneha',
    to: 'Rahul',
    amount: 1500,
    date: '2026-06-25T18:20:00.000Z'
  }
];

// Initialize localStorage with default data if empty
function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTLEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(DEFAULT_SETTLEMENTS));
  }
}

// Initialize on load
initializeData();

export const dataService = {
  // --- Groups API ---
  getGroups() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS)) || [];
  },

  getGroup(id) {
    const groups = this.getGroups();
    return groups.find(g => g.id === id);
  },

  saveGroup(group) {
    const groups = this.getGroups();
    const newGroup = {
      ...group,
      id: group.id || `group-${Date.now()}`,
      createdAt: group.createdAt || new Date().toISOString()
    };
    
    const index = groups.findIndex(g => g.id === newGroup.id);
    if (index >= 0) {
      groups[index] = newGroup;
    } else {
      groups.push(newGroup);
    }
    
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    return newGroup;
  },

  deleteGroup(id) {
    let groups = this.getGroups();
    groups = groups.filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));

    // Cleanup associated expenses and settlements
    let expenses = this.getExpenses();
    expenses = expenses.filter(e => e.groupId !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    let settlements = this.getSettlements();
    settlements = settlements.filter(s => s.groupId !== id);
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
  },

  // --- Expenses API ---
  getExpenses(groupId = null) {
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES)) || [];
    if (groupId) {
      return expenses.filter(e => e.groupId === groupId);
    }
    return expenses;
  },

  saveExpense(expense) {
    const expenses = this.getExpenses();
    const newExpense = {
      ...expense,
      id: expense.id || `exp-${Date.now()}`,
      date: expense.date || new Date().toISOString()
    };

    const index = expenses.findIndex(e => e.id === newExpense.id);
    if (index >= 0) {
      expenses[index] = newExpense;
    } else {
      expenses.push(newExpense);
    }

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return newExpense;
  },

  deleteExpense(id) {
    let expenses = this.getExpenses();
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  // --- Settlements API ---
  getSettlements(groupId = null) {
    const settlements = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTLEMENTS)) || [];
    if (groupId) {
      return settlements.filter(s => s.groupId === groupId);
    }
    return settlements;
  },

  recordSettlement(settlement) {
    const settlements = this.getSettlements();
    const newSettlement = {
      ...settlement,
      id: `settle-${Date.now()}`,
      date: new Date().toISOString()
    };

    settlements.push(newSettlement);
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
    return newSettlement;
  },

  deleteSettlement(id) {
    let settlements = this.getSettlements();
    settlements = settlements.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
  },

  // --- Reset All Data ---
  resetAll() {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(DEFAULT_SETTLEMENTS));
    return { groups: DEFAULT_GROUPS, expenses: DEFAULT_EXPENSES, settlements: DEFAULT_SETTLEMENTS };
  }
};
