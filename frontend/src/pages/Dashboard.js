import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Wallet, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

export default function Dashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const categoryData = summary?.category_breakdown ? Object.entries(summary.category_breakdown).map(([name, values]) => ({
    name,
    income: values.income,
    expense: values.expense
  })) : [];

  const COLORS = ['#10B981', '#F43F5E', '#3B82F6', '#F59E0B', '#8B5CF6'];

  const pieData = categoryData.map(cat => ({
    name: cat.name,
    value: cat.expense
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
          data-testid="total-balance-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-slate-700" strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">Total Balance</p>
          <p className="text-2xl font-bold text-slate-900">${summary?.total_balance?.toFixed(2) || '0.00'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
          data-testid="total-income-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">Income (This Month)</p>
          <p className="text-2xl font-bold text-emerald-600">${summary?.total_income?.toFixed(2) || '0.00'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
          data-testid="total-expenses-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">Expenses (This Month)</p>
          <p className="text-2xl font-bold text-rose-600">${summary?.total_expenses?.toFixed(2) || '0.00'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-lg text-white"
          data-testid="net-savings-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm text-slate-300 font-medium mb-1">Net Savings</p>
          <p className="text-2xl font-bold">${summary?.net_savings?.toFixed(2) || '0.00'}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
          data-testid="category-chart"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Income vs Expenses by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748B" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#F43F5E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No category data available
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
          data-testid="expense-breakdown-chart"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Expense Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No expense data available
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl border border-slate-100 shadow-sm"
        data-testid="recent-transactions"
      >
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {summary?.recent_transactions?.length > 0 ? (
            summary.recent_transactions.slice(0, 8).map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors" data-testid={`transaction-${tx.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}>
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{tx.category}</p>
                      <p className="text-sm text-slate-500">{tx.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              No transactions yet
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
