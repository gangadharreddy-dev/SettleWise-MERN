/**
 * SettleWise Debt Simplification Engine
 * Uses a Min-Max Greedy approach to resolve multi-party debts with the minimum number of transactions.
 */

/**
 * Calculates the net balance of each member in the group.
 * @param {Array} members - List of member names in the group
 * @param {Array} expenses - List of expenses
 * @returns {Object} A map of member names to their net balance (positive = they are owed, negative = they owe)
 */
export function calculateNetBalances(members, expenses) {
  const balances = {};
  
  // Initialize all members to 0 balance
  members.forEach(member => {
    balances[member] = 0;
  });

  // Calculate balances from expenses
  expenses.forEach(expense => {
    const totalAmount = parseFloat(expense.amount) || 0;
    const paidBy = expense.paidBy;
    const splitType = expense.splitType || 'equal'; // equal, exact, percentage
    const splits = expense.splits || {}; // map of member -> amount/percentage

    if (totalAmount === 0 || !paidBy) return;

    // Credit the payer
    if (balances[paidBy] !== undefined) {
      balances[paidBy] += totalAmount;
    }

    // Debit the members based on the split type
    if (splitType === 'equal') {
      const involvedMembers = expense.involvedMembers && expense.involvedMembers.length > 0
        ? expense.involvedMembers
        : members;
      const share = totalAmount / involvedMembers.length;
      
      involvedMembers.forEach(member => {
        if (balances[member] !== undefined) {
          balances[member] -= share;
        }
      });
    } else if (splitType === 'exact') {
      // splits maps member -> absolute amount owed
      Object.keys(splits).forEach(member => {
        const share = parseFloat(splits[member]) || 0;
        if (balances[member] !== undefined) {
          balances[member] -= share;
        }
      });
    } else if (splitType === 'percentage') {
      // splits maps member -> percentage (e.g. 50 for 50%)
      Object.keys(splits).forEach(member => {
        const percent = parseFloat(splits[member]) || 0;
        const share = (percent / 100) * totalAmount;
        if (balances[member] !== undefined) {
          balances[member] -= share;
        }
      });
    }
  });

  // Round balances to 2 decimal places to avoid floating point issues
  Object.keys(balances).forEach(member => {
    balances[member] = Math.round(balances[member] * 100) / 100;
  });

  return balances;
}

/**
 * Simplifies the debt between group members.
 * @param {Object} netBalances - Map of member -> net balance
 * @returns {Array} List of simplified transactions { from, to, amount }
 */
export function simplifyDebts(netBalances) {
  const debtors = [];
  const creditors = [];

  // Separate debtors and creditors
  Object.keys(netBalances).forEach(member => {
    const balance = netBalances[member];
    if (balance < -0.01) {
      debtors.push({ name: member, balance: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ name: member, balance: balance });
    }
  });

  const transactions = [];

  // Greedy matching of max debtor and max creditor
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by balance to always pair maximums
    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const settledAmount = Math.min(debtor.balance, creditor.balance);
    
    transactions.push({
      from: debtor.name,
      to: creditor.name,
      amount: Math.round(settledAmount * 100) / 100
    });

    // Update balances
    debtor.balance -= settledAmount;
    creditor.balance -= settledAmount;

    // Remove if settled, otherwise keep
    if (debtor.balance < 0.01) {
      debtors.shift();
    }
    if (creditor.balance < 0.01) {
      creditors.shift();
    }
  }

  return transactions;
}
