import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification,
} from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AdminUser } from '../types';

const ADMIN_ALLOWED_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'kusumabadiger10@gmail.com').trim().toLowerCase();

const debugAuth = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.info('[AUTH_DEBUG]', ...args);
  }
};

const buildUserSession = (user: User | null): AdminUser | null => {
  if (!user || !user.email) {
    return null;
  }

  const email = user.email.trim();
  const isAdmin = user.emailVerified && email.toLowerCase() === ADMIN_ALLOWED_EMAIL;

  return {
    uid: user.uid,
    email,
    displayName: user.displayName || (isAdmin ? 'Authorized Administrator' : 'Company Tech User'),
    role: isAdmin ? 'admin' : 'user',
  };
};

interface AuthContextType {
  user: AdminUser | null;
  firebaseUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  createAccountWithEmail: (email: string, pass: string) => Promise<User | null>;
  refreshVerificationStatus: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  loginAsDemoAdmin: () => void;
  logout: () => Promise<void>;
}

export const resolvePostAuthRoute = (user: User | null, fallbackRoute?: string | null): string => {
  if (!user || !user.emailVerified) {
    return fallbackRoute || '/auth';
  }

  const email = user.email?.trim().toLowerCase();
  if (email && email === ADMIN_ALLOWED_EMAIL) {
    return '/admin';
  }

  return fallbackRoute || '/dashboard';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const syncFirebaseSession = (user: User | null) => {
    setFirebaseUser(user);

    const sessionUser = buildUserSession(user);

    if (user && user.emailVerified && sessionUser) {
      setAdminUser(sessionUser);
      localStorage.setItem('companytech_user_session', JSON.stringify(sessionUser));
      if (sessionUser.role === 'admin') {
        localStorage.setItem('companytech_admin_session', JSON.stringify(sessionUser));
      } else {
        localStorage.removeItem('companytech_admin_session');
      }
      return;
    }

    setAdminUser(null);
    localStorage.removeItem('companytech_user_session');
    localStorage.removeItem('companytech_admin_session');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      debugAuth('AUTH_STATE_CHANGED', {
        hasUser: !!user,
        uid: user?.uid || null,
        email: user?.email || null,
        emailVerified: user?.emailVerified ?? null,
        pathname: typeof window !== 'undefined' ? window.location.pathname : null,
      });
      syncFirebaseSession(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User | null> => {
    setLoading(true);
    debugAuth('FIREBASE_SIGN_IN_STARTED', { provider: 'google' });
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      debugAuth('FIREBASE_SIGN_IN_SUCCESS', {
        hasUser: !!res.user,
        uid: res.user?.uid || null,
        emailVerified: res.user?.emailVerified ?? null,
        email: res.user?.email || null,
      });
      await res.user.reload();

      const currentUser = auth.currentUser;
      debugAuth('EMAIL_VERIFICATION_CHECK', {
        hasCurrentUser: !!currentUser,
        emailVerified: currentUser?.emailVerified ?? null,
      });
      if (currentUser && !currentUser.emailVerified) {
        throw new Error('Please verify your email before continuing to protected Company Tech pages.');
      }

      const sessionUser = buildUserSession(currentUser ?? res.user);
      if (sessionUser) {
        setAdminUser(sessionUser);
        localStorage.setItem('companytech_user_session', JSON.stringify(sessionUser));
        if (sessionUser.role === 'admin') {
          localStorage.setItem('companytech_admin_session', JSON.stringify(sessionUser));
        } else {
          localStorage.removeItem('companytech_admin_session');
        }
      }

      debugAuth('PROFILE_FETCH_SUCCESS', {
        role: sessionUser?.role || 'unknown',
        email: sessionUser?.email || null,
      });
      return auth.currentUser ?? res.user;
    } catch (error) {
      const err = error as { code?: string; message?: string } | Error;
      debugAuth('FIREBASE_SIGN_IN_FAILED', {
        code: 'code' in err ? err.code : null,
        message: err instanceof Error ? err.message : (err?.message ?? 'Unknown error'),
        provider: 'google',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    debugAuth('FIREBASE_SIGN_IN_STARTED', { provider: 'email', email: email.trim() });
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      debugAuth('FIREBASE_SIGN_IN_SUCCESS', {
        hasUser: !!res.user,
        uid: res.user?.uid || null,
        emailVerified: res.user?.emailVerified ?? null,
        email: res.user?.email || null,
      });
      await res.user.reload();

      const currentUser = auth.currentUser;
      debugAuth('EMAIL_VERIFICATION_CHECK', {
        hasCurrentUser: !!currentUser,
        emailVerified: currentUser?.emailVerified ?? null,
      });
      if (currentUser && !currentUser.emailVerified) {
        throw new Error('Your email is not verified yet. Please verify it and then sign in again.');
      }

      const sessionUser = buildUserSession(currentUser ?? res.user);
      if (sessionUser) {
        setAdminUser(sessionUser);
        localStorage.setItem('companytech_user_session', JSON.stringify(sessionUser));
        if (sessionUser.role === 'admin') {
          localStorage.setItem('companytech_admin_session', JSON.stringify(sessionUser));
        } else {
          localStorage.removeItem('companytech_admin_session');
        }
      }

      debugAuth('PROFILE_FETCH_SUCCESS', {
        role: sessionUser?.role || 'unknown',
        email: sessionUser?.email || null,
      });
      return currentUser ?? res.user;
    } catch (error) {
      const err = error as { code?: string; message?: string } | Error;
      debugAuth('FIREBASE_SIGN_IN_FAILED', {
        code: 'code' in err ? err.code : null,
        message: err instanceof Error ? err.message : (err?.message ?? 'Unknown error'),
        provider: 'email',
      });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createAccountWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    debugAuth('FIREBASE_SIGN_UP_STARTED', { provider: 'email', email: email.trim() });
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user && !res.user.emailVerified) {
        await sendEmailVerification(res.user);
      }

      const currentUser = auth.currentUser ?? res.user;
      const sessionUser = buildUserSession(currentUser);
      if (sessionUser && sessionUser.role === 'admin') {
        setAdminUser(sessionUser);
        localStorage.setItem('companytech_user_session', JSON.stringify(sessionUser));
        localStorage.setItem('companytech_admin_session', JSON.stringify(sessionUser));
      }

      debugAuth('PROFILE_FETCH_SUCCESS', {
        role: sessionUser?.role || 'unknown',
        email: sessionUser?.email || null,
      });
      return currentUser;
    } catch (error) {
      const err = error as { code?: string; message?: string } | Error;
      debugAuth('FIREBASE_SIGN_UP_FAILED', {
        code: 'code' in err ? err.code : null,
        message: err instanceof Error ? err.message : (err?.message ?? 'Unknown error'),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }

    await currentUser.reload();
    const refreshedUser = auth.currentUser;
    syncFirebaseSession(refreshedUser);
    return !!refreshedUser?.emailVerified;
  };

  const resendVerificationEmail = async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }

    if (currentUser.emailVerified) {
      return true;
    }

    await sendEmailVerification(currentUser);
    return true;
  };

  const loginAsDemoAdmin = () => {
    const demoAdmin: AdminUser = {
      uid: 'admin_usr_root',
      email: 'admin@companytech.internal',
      displayName: 'Lead Administrator',
      role: 'superadmin',
    };
    setAdminUser(demoAdmin);
    localStorage.setItem('companytech_admin_session', JSON.stringify(demoAdmin));
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setAdminUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('companytech_user_session');
    localStorage.removeItem('companytech_admin_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user: adminUser,
        firebaseUser,
        isAdmin: !!adminUser && (adminUser.role === 'admin' || adminUser.role === 'superadmin'),
        loading,
        loginWithGoogle,
        loginWithEmail,
        createAccountWithEmail,
        refreshVerificationStatus,
        resendVerificationEmail,
        loginAsDemoAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
