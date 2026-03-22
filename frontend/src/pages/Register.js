import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Wallet } from 'lucide-react';

export default function Register({ setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/register`, { name, email, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white">FinanceTracker</h1>
          </div>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Start Your Journey to<br />Financial Freedom
          </h2>
          <p className="text-slate-300 text-lg">
            Join thousands of users who trust us with their financial management and reporting.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">FinanceTracker</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
              <p className="text-slate-600">Get started with your financial tracking</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-slate-700 font-medium mb-2 block">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  data-testid="register-name-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="register-email-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 font-medium mb-2 block">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    data-testid="register-password-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-slate-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                data-testid="register-submit-button"
                disabled={loading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all active:scale-95"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-slate-900 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
