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
import { Plus, Trash2, RefreshCw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecurringTransactions() {
  const [recurringTxs, setRecurringTxs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    type: 'expense',
    category: '',
    amount: 0,
    description: '',
    frequency: 'monthly',
    custom_days: null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    fetchAccounts();
    fetchRecurringTransactions();
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
    }
  };

  const fetchRecurringTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/recurring-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecurringTxs(response.data);
    } catch (error) {
      toast.error('Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { ...formData };
      if (formData.frequency !== 'custom') {
        payload.custom_days = null;
      }
      if (!formData.end_date) {
        payload.end_date = null;
      }
      
      await axios.post(`${API}/recurring-transactions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Recurring transaction created successfully');
      setDialogOpen(false);
      setFormData({
        account_id: '',
        type: 'expense',
        category: '',
        amount: 0,
        description: '',
        frequency: 'monthly',
        custom_days: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
      fetchRecurringTransactions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create recurring transaction');
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/recurring-transactions/execute`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message);
      fetchRecurringTransactions();
    } catch (error) {
      toast.error('Failed to execute recurring transactions');
    } finally {
      setExecuting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring transaction?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/recurring-transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Recurring transaction deleted successfully');
      fetchRecurringTransactions();
    } catch (error) {
      toast.error('Failed to delete recurring transaction');
    }
  };

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom'
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="recurring-transactions-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Recurring Transactions</h1>
          <p className="text-slate-600 mt-1">Automate your regular income and expenses</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExecute}
            disabled={executing}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50"
            data-testid="execute-recurring-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${executing ? 'animate-spin' : ''}`} />
            Execute Now
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-recurring-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Recurring
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Recurring Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="account">Account</Label>
                  <Select value={formData.account_id} onValueChange={(value) => setFormData({...formData, account_id: value})} required>
                    <SelectTrigger data-testid="recurring-account-select">
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
                    <SelectTrigger data-testid="recurring-type-select">
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
                    data-testid="recurring-category-input"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., Rent, Subscription"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    data-testid="recurring-amount-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({...formData, frequency: value})}>
                    <SelectTrigger data-testid="recurring-frequency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom (Days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.frequency === 'custom' && (
                  <div>
                    <Label htmlFor="custom_days">Every X Days</Label>
                    <Input
                      id="custom_days"
                      type="number"
                      data-testid="recurring-custom-days-input"
                      value={formData.custom_days || ''}
                      onChange={(e) => setFormData({...formData, custom_days: parseInt(e.target.value)})}
                      placeholder="e.g., 15"
                      required
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    data-testid="recurring-start-date-input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    data-testid="recurring-end-date-input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    data-testid="recurring-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Add notes..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" data-testid="save-recurring-button">
                  Create Recurring Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recurringTxs.length > 0 ? (
          recurringTxs.map((rt, index) => {
            const account = accounts.find(a => a.id === rt.account_id);
            return (
              <motion.div
                key={rt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                data-testid={`recurring-item-${rt.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rt.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}>
                      <Clock className={`w-5 h-5 ${rt.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{rt.category}</h3>
                      <p className="text-sm text-slate-500">{account?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(rt.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                    data-testid={`delete-recurring-${rt.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className={`font-bold ${rt.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${rt.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Frequency</span>
                    <span className="text-sm font-medium text-slate-900">
                      {frequencyLabels[rt.frequency]}{rt.frequency === 'custom' && rt.custom_days ? ` (${rt.custom_days} days)` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Start Date</span>
                    <span className="text-sm text-slate-900">
                      {new Date(rt.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  {rt.end_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">End Date</span>
                      <span className="text-sm text-slate-900">
                        {new Date(rt.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {rt.last_executed && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Last Executed</span>
                      <span className="text-sm text-slate-900">
                        {new Date(rt.last_executed).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {rt.description && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-sm text-slate-600">{rt.description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Recurring Transactions</h3>
            <p className="text-slate-600 mb-4">Set up automatic transactions to save time</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Recurring Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
