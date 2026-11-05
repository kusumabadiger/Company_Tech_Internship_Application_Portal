import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Mail, Lock, UserPlus, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { resolvePostAuthRoute, useAuth } from '../context/AuthContext';

const debugAuthFlow = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.info('[AUTH_FLOW_DEBUG]', ...args);
  }
};

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithEmail, createAccountWithEmail, loginWithGoogle, firebaseUser, isAdmin, loading: authLoading, refreshVerificationStatus, resendVerificationEmail } = useAuth();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo || (isAdmin ? '/admin' : '/dashboard');
  const redirectMessage = (location.state as { message?: string } | null)?.message || null;

  const [mode, setMode] = useState<'signin' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(redirectMessage);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && firebaseUser && firebaseUser.emailVerified) {
      const destination = resolvePostAuthRoute(firebaseUser, returnTo);
      if (location.pathname === '/auth') {
        navigate(destination, { replace: true });
      }
    }
  }, [authLoading, firebaseUser, isAdmin, navigate, returnTo, location.pathname]);

  const isValidEmail = (value: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address to receive a password reset link.');
      setResetMessage(null);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      setResetMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResetMessage(null);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetMessage('If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.');
      setVerificationMessage(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send a password reset link right now.';
      const friendlyMessage = /invalid-email|auth\/invalid-email/i.test(message)
        ? 'Please enter a valid email address.'
        : /network|timeout|auth\/network-request-failed/i.test(message)
          ? 'Network error. Please check your connection and try again.'
          : 'We could not send a password reset email right now. Please try again in a moment.';
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    debugAuthFlow('SIGN_IN_SUBMITTED', {
      mode,
      emailProvided: !!email,
      pathname: location.pathname,
      returnTo,
      loading,
    });

    if (loading) {
      debugAuthFlow('SIGN_IN_SUPPRESSED_DUPLICATE_SUBMIT');
      return;
    }

    setError(null);
    setVerificationMessage(null);

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      let authenticatedUser = null;

      debugAuthFlow('FIREBASE_SIGN_IN_STARTED', { mode, email: email.trim() });
      if (mode === 'signup') {
        authenticatedUser = await createAccountWithEmail(email.trim(), password);
        debugAuthFlow('ACCOUNT_CREATED', { hasUser: !!authenticatedUser, emailVerified: authenticatedUser?.emailVerified ?? null });
        const verified = await refreshVerificationStatus();
        debugAuthFlow('EMAIL_VERIFICATION_CHECK', { verified, email: email.trim() });
        if (!verified) {
          setVerificationMessage('Account created. Please verify your email before continuing. We sent a verification email to your inbox.');
          return;
        }
      } else {
        authenticatedUser = await loginWithEmail(email.trim(), password);
        if (!authenticatedUser) {
          throw new Error('Sign-in did not return an authenticated Firebase user.');
        }

        await authenticatedUser.reload();
        const refreshedUser = auth.currentUser;
        debugAuthFlow('AFTER_FIREBASE_LOGIN', {
          hasUser: !!refreshedUser,
          emailVerified: refreshedUser?.emailVerified ?? null,
          uid: refreshedUser?.uid ?? null,
        });

        if (!refreshedUser) {
          throw new Error('Firebase session is not available after sign-in.');
        }

        if (!refreshedUser.emailVerified) {
          setVerificationMessage('Your email is not verified yet. Please verify it before continuing.');
          return;
        }

        const destination = resolvePostAuthRoute(refreshedUser, returnTo);
        debugAuthFlow('NAVIGATION_STARTED', { destination, hasUser: true, email: refreshedUser.email ?? null, isAdmin: refreshedUser.email?.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'kusumabadiger10@gmail.com').trim().toLowerCase() });
        navigate(destination, { replace: true });
        return;
      }

      const destination = resolvePostAuthRoute(authenticatedUser ?? firebaseUser, returnTo);
      debugAuthFlow('NAVIGATION_STARTED', { destination, hasUser: !!(authenticatedUser ?? firebaseUser) });
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      const errorCode = typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code || '')
        : '';
      debugAuthFlow('FIREBASE_SIGN_IN_FAILED', {
        code: errorCode || null,
        message,
        mode,
      });
      if (mode === 'signin' && errorCode === 'auth/user-not-found') {
        setMode('signup');
        setError('No account was found for this email. Create your account below to get started.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setVerificationMessage(null);
    if (loading) {
      return;
    }
    setLoading(true);
    debugAuthFlow('GOOGLE_SIGN_IN_STARTED', { pathname: location.pathname });
    try {
      const authenticatedUser = await loginWithGoogle();
      if (!authenticatedUser) {
        throw new Error('Google sign-in did not return an authenticated Firebase user.');
      }

      await authenticatedUser.reload();
      const refreshedUser = auth.currentUser;
      if (!refreshedUser) {
        throw new Error('Google sign-in session is not available after authentication.');
      }

      const verified = await refreshVerificationStatus();
      debugAuthFlow('GOOGLE_SIGN_IN_VERIFICATION', { verified, hasUser: !!refreshedUser, emailVerified: refreshedUser.emailVerified ?? null });
      if (!verified) {
        setVerificationMessage('Google sign-in succeeded, but your email is not verified. Please verify it before continuing.');
        return;
      }
      const destination = resolvePostAuthRoute(refreshedUser, returnTo);
      debugAuthFlow('NAVIGATION_STARTED', { destination, hasUser: true, email: refreshedUser.email ?? null });
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed.';
      debugAuthFlow('GOOGLE_SIGN_IN_FAILED', { message });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setVerificationMessage(null);
    try {
      const sent = await resendVerificationEmail();
      setVerificationMessage(sent ? 'Verification email resent. Please check your inbox and refresh once you confirm it.' : 'Unable to resend verification email.');
    } catch (err) {
      setVerificationMessage(err instanceof Error ? err.message : 'Unable to resend the verification email.');
    }
  };

  const handleRefreshStatus = async () => {
    setError(null);
    try {
      const verified = await refreshVerificationStatus();
      if (verified) {
        setVerificationMessage('Email verified successfully. You can continue.');
        navigate(returnTo, { replace: true });
        return;
      }
      setVerificationMessage('Your email is still not verified. Please check your inbox and try again.');
    } catch (err) {
      setVerificationMessage(err instanceof Error ? err.message : 'Unable to refresh verification status.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome to Company Tech</h1>
          <p className="text-sm text-slate-500">
            Sign in to continue or create a new account to manage your internship access.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetMessage && (
            <div className="mb-4 p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
              <p>{resetMessage}</p>
            </div>
          )}

          {verificationMessage && (
            <div className="mb-4 p-3 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg space-y-2">
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

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 mb-5">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-medium text-blue-700 hover:text-blue-900 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
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
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {mode === 'signup' ? <UserPlus size={14} /> : <Sparkles size={14} />}
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="grow border-t border-slate-200" />
            <span className="shrink mx-3 text-[11px] text-slate-400 uppercase font-medium">Or continue with</span>
            <div className="grow border-t border-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.89c2.28-2.1 3.65-5.2 3.65-9.15z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3.05c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.26 21.46 7.35 24 12 24z" />
              <path fill="#FBBC05" d="M5.32 14.24c-.25-.72-.39-1.49-.39-2.24s.14-1.52.39-2.24V6.61H1.21C.44 8.16 0 9.9 0 12s.44 3.84 1.21 5.39l4.11-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.54 1.21 6.61l4.11 3.15c.94-2.85 3.57-5.01 6.68-5.01z" />
            </svg>
            <span>Continue with Google</span>
          </button>

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
