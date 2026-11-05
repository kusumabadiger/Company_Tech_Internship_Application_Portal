import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { auth } from '../config/firebase';
import { resolvePostAuthRoute, useAuth } from '../context/AuthContext';

const debugAdminFlow = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.info('[ADMIN_FLOW_DEBUG]', ...args);
  }
};

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail, createAccountWithEmail, loginWithGoogle, firebaseUser, isAdmin, loading: authLoading, refreshVerificationStatus, resendVerificationEmail } = useAuth();

  const [email, setEmail] = useState('admin@companytech.internal');
  const [password, setPassword] = useState('Admin@2026');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && firebaseUser && firebaseUser.emailVerified) {
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [authLoading, firebaseUser, isAdmin, navigate]);

  const isValidEmail = (value: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    debugAdminFlow('SIGN_IN_SUBMITTED', {
      mode,
      emailProvided: !!email,
      loading,
    });

    if (loading) {
      debugAdminFlow('SIGN_IN_SUPPRESSED_DUPLICATE_SUBMIT');
      return;
    }

    setError(null);
    setVerificationMessage(null);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const authenticatedUser = await createAccountWithEmail(email.trim(), password);
        const verified = await refreshVerificationStatus();
        debugAdminFlow('EMAIL_VERIFICATION_CHECK', { verified, hasUser: !!authenticatedUser });
        if (!verified) {
          setVerificationMessage('Account created. Please verify your email before continuing to the admin dashboard.');
          return;
        }
        const destination = resolvePostAuthRoute(authenticatedUser ?? firebaseUser, '/admin');
        debugAdminFlow('NAVIGATION_STARTED', { destination, hasUser: !!(authenticatedUser ?? firebaseUser) });
        navigate(destination, { replace: true });
        return;
      }

      const authenticatedUser = await loginWithEmail(email.trim(), password);
      if (!authenticatedUser) {
        throw new Error('Admin sign-in did not return an authenticated Firebase user.');
      }

      await authenticatedUser.reload();
      const refreshedUser = auth.currentUser;
      if (!refreshedUser) {
        throw new Error('Admin Firebase session is not available after sign-in.');
      }

      if (!refreshedUser.emailVerified) {
        setVerificationMessage('Your email is not verified yet. Please verify it before continuing.');
        return;
      }

      const destination = resolvePostAuthRoute(refreshedUser, '/admin');
      debugAdminFlow('NAVIGATION_STARTED', { destination, hasUser: true, email: refreshedUser.email ?? null });
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : mode === 'signup' ? 'Unable to create the administrator account.' : 'Invalid credentials. Please verify your administrator login.';
      debugAdminFlow('FIREBASE_SIGN_IN_FAILED', { message });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setError(null);
    if (loading) {
      return;
    }
    setLoading(true);
    debugAdminFlow('GOOGLE_SIGN_IN_STARTED', { pathname: window.location.pathname });
    try {
      const authenticatedUser = await loginWithGoogle();
      if (!authenticatedUser) {
        throw new Error('Google admin sign-in did not return an authenticated Firebase user.');
      }

      await authenticatedUser.reload();
      const refreshedUser = auth.currentUser;
      if (!refreshedUser) {
        throw new Error('Google admin session is not available after authentication.');
      }

      const verified = await refreshVerificationStatus();
      debugAdminFlow('GOOGLE_SIGN_IN_VERIFICATION', { verified, hasUser: !!refreshedUser, emailVerified: refreshedUser.emailVerified ?? null });
      if (!verified) {
        setVerificationMessage('Google sign-in succeeded, but your email is not verified. Please verify it before continuing.');
        return;
      }
      const destination = resolvePostAuthRoute(refreshedUser, '/admin');
      debugAdminFlow('NAVIGATION_STARTED', { destination, hasUser: true, email: refreshedUser.email ?? null });
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      debugAdminFlow('GOOGLE_SIGN_IN_FAILED', { message });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    try {
      const sent = await resendVerificationEmail();
      setVerificationMessage(sent ? 'Verification email resent. Please check your inbox and refresh once you confirm it.' : 'Unable to resend the verification email.');
    } catch (err) {
      setVerificationMessage(err instanceof Error ? err.message : 'Unable to resend verification email.');
    }
  };

  const handleRefreshStatus = async () => {
    setError(null);
    try {
      const verified = await refreshVerificationStatus();
      if (verified) {
        setVerificationMessage('Email verified successfully. Redirecting to the admin dashboard...');
        navigate('/admin', { replace: true });
        return;
      }
      setVerificationMessage('Your email is still not verified. Please check your inbox and try again.');
    } catch (err) {
      setVerificationMessage(err instanceof Error ? err.message : 'Unable to refresh verification state.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrator Gateway
          </h2>
          <p className="text-xs text-slate-500">
            Sign in to manage Company Tech internship applications and decisions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {verificationMessage && (
            <div className="p-3 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg space-y-2">
              <p>{verificationMessage}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleResendVerification} className="px-2 py-1 rounded bg-white border border-amber-300 text-amber-800 font-medium">
                  Resend verification email
                </button>
                <button type="button" onClick={handleRefreshStatus} className="px-2 py-1 rounded bg-amber-600 text-white font-medium">
                  I have verified my email — Refresh status
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {mode === 'signup' ? 'Email Address' : 'Administrator Email'}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@companytech.internal"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'signup' ? 'Creating account...' : 'Authenticating...'}
                </>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-[11px] text-slate-400 uppercase font-medium">Or</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          <div className="space-y-2.5">
            {/* Google Authentication */}
            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={loading}
              className="w-full py-2 px-4 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.89c2.28-2.1 3.65-5.2 3.65-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3.05c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.26 21.46 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.24c-.25-.72-.39-1.49-.39-2.24s.14-1.52.39-2.24V6.61H1.21C.44 8.16 0 9.9 0 12s.44 3.84 1.21 5.39l4.11-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.54 1.21 6.61l4.11 3.15c.94-2.85 3.57-5.01 6.68-5.01z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              Return to Public Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
