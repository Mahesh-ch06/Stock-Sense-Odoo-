// Signup Page — POST /auth/signup with Shadcn design system
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { Boxes, User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/signup', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

        <h1 className="auth-title">Create an Account</h1>
        <p className="auth-sub">Provision access to your warehouse workspace</p>

        {error && (
          <div className="alert-error mb-4 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="relative">
              <input
                id="signup-name"
                type="text"
                className="form-control pl-8.5"
                placeholder="Alex Mercer"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Work Email</label>
            <div className="relative">
              <input
                id="signup-email"
                type="email"
                className="form-control pl-8.5"
                placeholder="alex@company.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                id="signup-password"
                type="password"
                className="form-control pl-8.5"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
              />
              <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="relative">
              <input
                id="signup-confirm"
                type="password"
                className="form-control pl-8.5"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                required
              />
              <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <Button
            id="signup-submit"
            type="submit"
            size="lg"
            className="w-full mt-2 font-semibold text-xs"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Complete Registration'}
            {!loading && <ArrowRight size={13} />}
          </Button>
        </form>

        <p className="auth-switch text-xs text-zinc-500 mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-zinc-200 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
