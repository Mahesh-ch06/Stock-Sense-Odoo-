// Forgot Password — OTP request + verify flow with Shadcn Zinc styling
import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Boxes, Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpass, 3=success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      await API.post('/auth/otp/request', { email });
      setMsg('A 6-digit one-time passcode has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch recovery OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      await API.post('/auth/otp/verify', { email, otp, new_password: newPass });
      setMsg('Your password has been successfully updated. You can now sign in.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP passcode.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-zinc-800 selection:text-zinc-100">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
            <Boxes className="h-5 w-5 text-zinc-100" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-100">StockSense</span>
            <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/60 text-zinc-400">
              ERP
            </span>
          </div>
        </div>

        <Card className="border-zinc-800/80 bg-zinc-900/60 shadow-xl backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight text-zinc-100">
              {step === 1 && 'Reset your password'}
              {step === 2 && 'Enter verification code'}
              {step === 3 && 'Password successfully reset'}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              {step === 1 && "We'll send a 6-digit security code to your registered corporate email."}
              {step === 2 && 'Check your inbox for the OTP and choose a strong new password.'}
              {step === 3 && 'Your account security credentials have been updated.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-500/20 bg-red-950/20 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
            {msg && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-relaxed">{msg}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Corporate Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                      required
                    />
                  </div>
                </div>
                <Button
                  id="forgot-send-otp"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium h-9 text-xs transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending OTP…
                    </span>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">6-Digit OTP</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      id="forgot-otp"
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="pl-9 font-mono tracking-widest bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      id="forgot-newpass"
                      type="password"
                      placeholder="At least 8 characters"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="pl-9 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <Button
                  id="forgot-verify"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium h-9 text-xs transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Updating Password…
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            {step === 3 && (
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium h-9 text-xs transition-colors">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-0 flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to login</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
