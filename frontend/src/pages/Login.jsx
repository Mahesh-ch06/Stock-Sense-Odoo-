// Login Page — POST /auth/login with Shadcn design system & Quick Demo Fill
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { Boxes, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAccount(email, password) {
    setForm({ email, password });
    setError('');
  }

  return (
    <div className="auth-page px-4">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-logo">
          <div className="logo-icon">
            <Boxes size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-name">StockSense</div>
            <div className="text-[10.5px] text-zinc-500 uppercase tracking-wider">Enterprise ERP</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your warehouse management console</p>

        {error && (
          <div className="alert-error mb-4 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                className="form-control pl-8.5"
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-zinc-400 hover:text-zinc-200">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type="password"
                className="form-control pl-8.5"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <Button
            id="login-submit"
            type="submit"
            size="lg"
            className="w-full mt-1.5 font-semibold text-xs"
            disabled={loading}
          >
            {loading ? 'Authenticating…' : 'Sign In to Workspace'}
            {!loading && <ArrowRight size={13} />}
          </Button>
        </form>

        {/* Demo Accounts Quick-Fill Section */}
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
            <span className="flex items-center gap-1 font-medium text-zinc-300">
              <Sparkles size={11} className="text-amber-400" />
              Quick Demo Logins
            </span>
            <span className="text-[10px] text-zinc-500">1-click fill</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className="text-[11px] py-1.5 px-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left"
              onClick={() => fillDemoAccount('manager@stocksense.com', 'StockSense2026!')}
            >
              <div className="font-medium">Manager</div>
              <div className="text-[10px] text-zinc-500 truncate">manager@stocksense.com</div>
            </button>
            <button
              type="button"
              className="text-[11px] py-1.5 px-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left"
              onClick={() => fillDemoAccount('staff@stocksense.com', 'StockSense2026!')}
            >
              <div className="font-medium">Staff</div>
              <div className="text-[10px] text-zinc-500 truncate">staff@stocksense.com</div>
            </button>
          </div>
        </div>

        <p className="auth-switch text-xs text-zinc-500 mt-4">
          Need an account?{' '}
          <Link to="/signup" className="text-zinc-200 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
