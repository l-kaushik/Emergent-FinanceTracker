import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterAccount, setFilterAccount] = useState('');
  const [formData, setFormData] = useState({
    account_id: '',
    type: 'expense',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, [filterAccount]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(response.data);
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filterAccount ? `${API}/transactions?account_id=${filterAccount}` : `${API}/transactions`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/transactions`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transaction added successfully');
      setDialogOpen(false);
      setFormData({
        account_id: '',
        type: 'expense',
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transaction deleted successfully');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="transactions-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-slate-600 mt-1">Track your income and expenses</p>
        </div>
        <div className="flex gap-3">
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="w-48" data-testid="filter-account-select">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Accounts</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-transaction-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="account">Account</Label>
                  <Select value={formData.account_id} onValueChange={(value) => setFormData({...formData, account_id: value})} required>
                    <SelectTrigger data-testid="transaction-account-select">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger data-testid="transaction-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    data-testid="transaction-category-input"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., Salary, Food, Rent"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    data-testid="transaction-amount-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    data-testid="transaction-date-input"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    data-testid="transaction-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Add notes..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" data-testid="save-transaction-button">
                  Add Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => {
              const account = accounts.find(a => a.id === tx.account_id);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-50 transition-colors"
                  data-testid={`transaction-item-${tx.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'
                      }`}>
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{tx.category}</p>
                          <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded">in {account?.name || 'Unknown'}</span>
                        </div>
                        <p className="text-sm text-slate-500">{tx.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        data-testid={`delete-transaction-${tx.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-400">
              <p>No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
