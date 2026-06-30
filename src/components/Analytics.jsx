import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3, Calendar, TrendingUp, TrendingDown, DollarSign,
  Printer, Filter, PieChart, ArrowRight, ChevronLeft, ChevronRight,
  Receipt, Users, Wallet
} from 'lucide-react';

const CATEGORY_COLORS = {
  'General': '#8b5cf6',
  'Accommodation': '#06b6d4',
  'Food & Drinks': '#f59e0b',
  'Transport': '#3b82f6',
  'Entertainment': '#ec4899',
  'Groceries': '#10b981',
  'Utilities': '#f43f5e'
};

export default function Analytics({ groups, allExpenses, allSettlements, activeUser }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const reportRef = useRef(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigate months
  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Filter expenses by month, year, and optionally group
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(exp => {
      const expDate = new Date(exp.date);
      const matchesMonth = expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear;
      const matchesGroup = selectedGroupId === 'all' || exp.groupId === selectedGroupId;
      return matchesMonth && matchesGroup;
    });
  }, [allExpenses, selectedMonth, selectedYear, selectedGroupId]);

  // Filter settlements by month/year
  const filteredSettlements = useMemo(() => {
    return allSettlements.filter(s => {
      const sDate = new Date(s.date);
      const matchesMonth = sDate.getMonth() === selectedMonth && sDate.getFullYear() === selectedYear;
      const matchesGroup = selectedGroupId === 'all' || s.groupId === selectedGroupId;
      return matchesMonth && matchesGroup;
    });
  }, [allSettlements, selectedMonth, selectedYear, selectedGroupId]);

  // Calculate summary metrics
  const summary = useMemo(() => {
    let totalSpent = 0;
    let yourShare = 0;
    let youPaid = 0;
    let transactionCount = filteredExpenses.length;

    filteredExpenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      totalSpent += amount;

      // Calculate user's share
      if (exp.splitType === 'equal') {
        const involved = exp.involvedMembers && exp.involvedMembers.length > 0
          ? exp.involvedMembers
          : [];
        if (involved.includes(activeUser)) {
          yourShare += amount / involved.length;
        }
      } else if (exp.splitType === 'exact' && exp.splits) {
        const share = parseFloat(exp.splits[activeUser]) || 0;
        yourShare += share;
      } else if (exp.splitType === 'percentage' && exp.splits) {
        const pct = parseFloat(exp.splits[activeUser]) || 0;
        yourShare += (pct / 100) * amount;
      }

      if (exp.paidBy === activeUser) {
        youPaid += amount;
      }
    });

    let totalSettled = 0;
    filteredSettlements.forEach(s => {
      totalSettled += s.amount;
    });

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      yourShare: Math.round(yourShare * 100) / 100,
      youPaid: Math.round(youPaid * 100) / 100,
      netBalance: Math.round((youPaid - yourShare) * 100) / 100,
      transactionCount,
      totalSettled: Math.round(totalSettled * 100) / 100,
      settlementCount: filteredSettlements.length
    };
  }, [filteredExpenses, filteredSettlements, activeUser]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categories = {};
    filteredExpenses.forEach(exp => {
      const cat = exp.category || 'General';
      if (!categories[cat]) {
        categories[cat] = { total: 0, count: 0 };
      }
      categories[cat].total += parseFloat(exp.amount) || 0;
      categories[cat].count += 1;
    });

    // Convert to sorted array
    return Object.entries(categories)
      .map(([name, data]) => ({
        name,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        percentage: summary.totalSpent > 0 ? Math.round((data.total / summary.totalSpent) * 100) : 0,
        color: CATEGORY_COLORS[name] || '#64748b'
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, summary.totalSpent]);

  // Group-wise breakdown
  const groupBreakdown = useMemo(() => {
    const groupMap = {};
    filteredExpenses.forEach(exp => {
      if (!groupMap[exp.groupId]) {
        const group = groups.find(g => g.id === exp.groupId);
        groupMap[exp.groupId] = {
          name: group ? group.name : 'Unknown Group',
          total: 0,
          count: 0
        };
      }
      groupMap[exp.groupId].total += parseFloat(exp.amount) || 0;
      groupMap[exp.groupId].count += 1;
    });

    return Object.entries(groupMap)
      .map(([id, data]) => ({
        id,
        name: data.name,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        percentage: summary.totalSpent > 0 ? Math.round((data.total / summary.totalSpent) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, groups, summary.totalSpent]);

  // Top spenders (who paid the most)
  const topSpenders = useMemo(() => {
    const spenderMap = {};
    filteredExpenses.forEach(exp => {
      if (!spenderMap[exp.paidBy]) {
        spenderMap[exp.paidBy] = 0;
      }
      spenderMap[exp.paidBy] += parseFloat(exp.amount) || 0;
    });

    return Object.entries(spenderMap)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredExpenses]);

  // Daily spending trend for the month
  const dailyTrend = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      total: 0
    }));

    filteredExpenses.forEach(exp => {
      const day = new Date(exp.date).getDate();
      if (day >= 1 && day <= daysInMonth) {
        days[day - 1].total += parseFloat(exp.amount) || 0;
      }
    });

    const maxVal = Math.max(...days.map(d => d.total), 1);
    return { days, maxVal };
  }, [filteredExpenses, selectedMonth, selectedYear]);

  // Print report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="analytics-container animated-fade-in" ref={reportRef}>
      {/* Header with Month Selector */}
      <div className="analytics-header card glass">
        <div className="analytics-title-row">
          <div className="analytics-title">
            <BarChart3 size={24} className="icon-vibrant" />
            <div>
              <h1>Monthly Report & Analytics</h1>
              <p className="subtitle">Detailed expense insights for {activeUser}</p>
            </div>
          </div>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm btn-icon-label print-btn">
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>

        {/* Month Navigator */}
        <div className="month-nav-row">
          <div className="month-navigator">
            <button onClick={goToPrevMonth} className="btn-icon">
              <ChevronLeft size={20} />
            </button>
            <div className="month-display">
              <Calendar size={16} />
              <span className="month-label">{monthNames[selectedMonth]} {selectedYear}</span>
            </div>
            <button onClick={goToNextMonth} className="btn-icon">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="group-filter">
            <Filter size={14} />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Groups</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card card glass">
          <div className="stat-icon-wrapper blue">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Group Spending</span>
            <span className="stat-value">₹{summary.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="stat-sub">{summary.transactionCount} expense{summary.transactionCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="analytics-stat-card card glass">
          <div className="stat-icon-wrapper red">
            <Wallet size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Your Share</span>
            <span className="stat-value negative">₹{summary.yourShare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="stat-sub">of the total expenses</span>
          </div>
        </div>

        <div className="analytics-stat-card card glass">
          <div className="stat-icon-wrapper green">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">You Paid</span>
            <span className="stat-value positive">₹{summary.youPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="stat-sub">on behalf of the group</span>
          </div>
        </div>

        <div className="analytics-stat-card card glass">
          <div className={`stat-icon-wrapper ${summary.netBalance >= 0 ? 'green' : 'red'}`}>
            {summary.netBalance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div className="stat-content">
            <span className="stat-label">Net Balance</span>
            <span className={`stat-value ${summary.netBalance > 0.01 ? 'positive' : summary.netBalance < -0.01 ? 'negative' : 'neutral'}`}>
              {summary.netBalance > 0 ? '+' : ''}₹{summary.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="stat-sub">{summary.netBalance >= 0 ? 'others owe you' : 'you owe others'}</span>
          </div>
        </div>
      </div>

      {/* No data state */}
      {filteredExpenses.length === 0 ? (
        <div className="analytics-empty card glass">
          <Receipt size={40} className="text-muted" />
          <h3>No expenses found</h3>
          <p>There are no expenses recorded for {monthNames[selectedMonth]} {selectedYear}. Try selecting a different month or group.</p>
        </div>
      ) : (
        <div className="analytics-body-grid">
          {/* Left Column */}
          <div className="analytics-left">
            {/* Daily Spending Trend (Bar Chart) */}
            <div className="analytics-section card glass">
              <h3 className="section-heading">
                <BarChart3 size={16} />
                Daily Spending Trend
              </h3>
              <div className="daily-chart">
                <div className="chart-bars">
                  {dailyTrend.days.map((d) => {
                    const heightPct = dailyTrend.maxVal > 0 ? (d.total / dailyTrend.maxVal) * 100 : 0;
                    return (
                      <div key={d.day} className="chart-bar-col" title={`Day ${d.day}: ₹${d.total.toLocaleString('en-IN')}`}>
                        <div className="chart-bar-track">
                          <div
                            className="chart-bar-fill"
                            style={{ height: `${Math.max(heightPct, d.total > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        {(d.day === 1 || d.day % 5 === 0 || d.day === dailyTrend.days.length) && (
                          <span className="chart-bar-label">{d.day}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="analytics-section card glass">
              <h3 className="section-heading">
                <PieChart size={16} />
                Category Breakdown
              </h3>
              {categoryBreakdown.length === 0 ? (
                <p className="text-muted">No category data available.</p>
              ) : (
                <div className="category-list">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="category-row">
                      <div className="category-info">
                        <div className="category-dot" style={{ backgroundColor: cat.color }} />
                        <span className="category-name">{cat.name}</span>
                        <span className="category-count">{cat.count} expense{cat.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="category-bar-wrapper">
                        <div className="category-bar-track">
                          <div
                            className="category-bar-fill"
                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                          />
                        </div>
                        <div className="category-values">
                          <span className="category-amount">₹{cat.total.toLocaleString('en-IN')}</span>
                          <span className="category-pct">{cat.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="analytics-right">
            {/* Group Breakdown */}
            {selectedGroupId === 'all' && groupBreakdown.length > 1 && (
              <div className="analytics-section card glass">
                <h3 className="section-heading">
                  <Users size={16} />
                  Group-wise Split
                </h3>
                <div className="group-breakdown-list">
                  {groupBreakdown.map((gb) => (
                    <div key={gb.id} className="group-breakdown-item">
                      <div className="gbi-header">
                        <span className="gbi-name">{gb.name}</span>
                        <span className="gbi-amount">₹{gb.total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="category-bar-track">
                        <div
                          className="category-bar-fill gradient-bar"
                          style={{ width: `${gb.percentage}%` }}
                        />
                      </div>
                      <span className="gbi-meta">{gb.count} expense{gb.count !== 1 ? 's' : ''} · {gb.percentage}% of total</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Spenders */}
            <div className="analytics-section card glass">
              <h3 className="section-heading">
                <TrendingUp size={16} />
                Top Spenders (Who Paid)
              </h3>
              <div className="top-spenders-list">
                {topSpenders.map((spender, idx) => (
                  <div key={spender.name} className="spender-row">
                    <div className="spender-rank">{idx + 1}</div>
                    <span className="spender-name">{spender.name}</span>
                    <span className="spender-amount">₹{spender.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Log for the Month */}
            <div className="analytics-section card glass">
              <h3 className="section-heading">
                <Receipt size={16} />
                Expense Log — {monthNames[selectedMonth]}
              </h3>
              <div className="monthly-expense-log">
                {filteredExpenses
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((exp) => {
                    const dateStr = new Date(exp.date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    });
                    const groupName = groups.find(g => g.id === exp.groupId)?.name || '';
                    return (
                      <div key={exp.id} className="log-item">
                        <div className="log-date">{dateStr}</div>
                        <div className="log-details">
                          <span className="log-title">{exp.title}</span>
                          <span className="log-meta">Paid by {exp.paidBy} · {groupName}</span>
                        </div>
                        <span className="log-amount">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Settlements for the Month */}
            {filteredSettlements.length > 0 && (
              <div className="analytics-section card glass">
                <h3 className="section-heading">
                  <ArrowRight size={16} />
                  Settlements — {monthNames[selectedMonth]}
                </h3>
                <div className="monthly-expense-log">
                  {filteredSettlements.map((s) => {
                    const dateStr = new Date(s.date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    });
                    return (
                      <div key={s.id} className="log-item settlement-log">
                        <div className="log-date">{dateStr}</div>
                        <div className="log-details">
                          <span className="log-title">{s.from} → {s.to}</span>
                          <span className="log-meta">Direct settlement</span>
                        </div>
                        <span className="log-amount settled">₹{s.amount.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
