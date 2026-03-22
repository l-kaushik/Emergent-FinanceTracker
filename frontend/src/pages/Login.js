import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Wallet } from 'lucide-react';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
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
            Take Control of Your<br />Financial Future
          </h2>
          <p className="text-slate-300 text-lg">
            Track expenses, manage multiple accounts, and generate insightful reports across all your devices.
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
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-600">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="login-email-input"
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
                    data-testid="login-password-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                data-testid="login-submit-button"
                disabled={loading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all active:scale-95"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-slate-900 font-semibold hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
