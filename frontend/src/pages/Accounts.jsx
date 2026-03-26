import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    initial_balance: 0,
    currency: 'USD'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(response.data);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/accounts`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Account created successfully');
      setDialogOpen(false);
      setFormData({ name: '', type: 'checking', initial_balance: 0, currency: 'USD' });
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const accountTypeColors = {
    checking: 'bg-blue-50 text-blue-700 border-blue-200',
    savings: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    credit: 'bg-rose-50 text-rose-700 border-rose-200',
    investment: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="accounts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Accounts</h1>
          <p className="text-slate-600 mt-1">Manage your financial accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-account-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  data-testid="account-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Main Checking"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Account Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger data-testid="account-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="balance">Initial Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  data-testid="account-balance-input"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({...formData, initial_balance: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" data-testid="save-account-button">
                Create Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6" strokeWidth={2} />
          <p className="text-slate-300 font-medium">Total Balance Across All Accounts</p>
        </div>
        <p className="text-4xl font-bold">${totalBalance.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
            data-testid={`account-card-${account.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${accountTypeColors[account.type] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </div>
              <button
                onClick={() => handleDelete(account.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors"
                data-testid={`delete-account-${account.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{account.name}</h3>
            <p className="text-2xl font-bold text-slate-900">${account.balance.toFixed(2)}</p>
            <p className="text-sm text-slate-500 mt-2">{account.currency}</p>
          </motion.div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Accounts Yet</h3>
          <p className="text-slate-600 mb-4">Create your first account to start tracking your finances</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Account
          </Button>
        </div>
      )}
    </div>
  );
}
