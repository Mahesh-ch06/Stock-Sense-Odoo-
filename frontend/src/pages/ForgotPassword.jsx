// Forgot Password — OTP request + verify flow
import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpass
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      await API.post('/auth/otp/request', { email });
      setMsg('OTP sent! Check your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally { setLoading(false); }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      await API.post('/auth/otp/verify', { email, otp, new_password: newPass });
      setMsg('Password reset! You can now sign in.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">S</div>
          <div className="logo-name">StockSense</div>
        </div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-sub">
          {step === 1 && "We'll send a one-time code to your email."}
          {step === 2 && 'Enter the OTP and set a new password.'}
          {step === 3 && 'Your password has been reset.'}
        </p>

        {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {msg   && <div className="alert-success" style={{ marginBottom: 16 }}>{msg}</div>}

        {step === 1 && (
          <form className="auth-form" onSubmit={handleRequest}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input id="forgot-email" type="email" className="form-control" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button id="forgot-send-otp" type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? <><span className="spinner" /> Sending…</> : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input id="forgot-otp" type="text" className="form-control" placeholder="6-digit code"
                value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input id="forgot-newpass" type="password" className="form-control" placeholder="Min 8 characters"
                value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={8} />
            </div>
            <button id="forgot-verify" type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? <><span className="spinner" /> Verifying…</> : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <Link to="/login" className="btn btn-primary"
            style={{ display: 'flex', justifyContent: 'center', padding: '11px', marginTop: 16 }}>
            Go to Login
          </Link>
        )}

        <p className="auth-switch" style={{ marginTop: 16 }}>
          <Link to="/login" className="auth-link">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
