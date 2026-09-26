// Signup Page — POST /auth/signup
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

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
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">S</div>
          <div className="logo-name">StockSense</div>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join your warehouse team</p>

        {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="signup-name" type="text" className="form-control" placeholder="Your name"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="signup-email" type="email" className="form-control" placeholder="you@company.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="signup-password" type="password" className="form-control" placeholder="Min 8 characters"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input id="signup-confirm" type="password" className="form-control" placeholder="Repeat password"
              value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button id="signup-submit" type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            {loading ? <><span className="spinner" /> Creating…</> : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
